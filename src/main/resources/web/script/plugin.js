dm4c.add_plugin("de.deepamehta.box-renderer-dom", function() {

    var DEFAULT_TOPIC_COLOR = "hsl(210,100%,90%)"   // must match server-side (see BoxRendererPlugin.java)
                                                    // must match top/left color in color dialog (see below)

    var IMG_SRC_EXPANDED  = "/de.deepamehta.box-renderer-dom/images/expanded.png"
    var IMG_SRC_COLLAPSED = "/de.deepamehta.box-renderer-dom/images/collapsed.png"

    var PROP_COLOR    = "dm4.boxrenderer.color"
    var PROP_EXPANDED = "dm4.boxrenderer.expanded"

    var canvas_view

    // === Webclient Listeners ===

    /**
     * Note: the Topicmaps plugin instantiates the topicmap renderers (as provided by the
     * installed plugins) at "init" time. Registering our customizers at "init_2" ensures
     * the respective topicmap renderer is available already.
     */
    dm4c.add_listener("init_2", function() {
        var canvas_renderer = dm4c.get_plugin("de.deepamehta.topicmaps")
            .get_topicmap_renderer("dm4.webclient.default_topicmap_renderer")
        //
        canvas_renderer.add_view_customizer(BoxView)
        canvas_renderer.add_viewmodel_customizer(BoxViewmodel)
    })

    dm4c.add_listener("topic_commands", function(topic) {
        return [
            {
                is_separator: true,
                context: "context-menu"
            },
            {
                label:   "Set Color",
                handler: do_open_color_dialog,
                context: "context-menu"
            }
        ]

        function do_open_color_dialog() {

            var current_color = canvas_view.get_topic(topic.id).view_props[PROP_COLOR]
            var content = $()
            add_color_row("100%", "90%")
            add_color_row( "80%", "80%")
            //
            var color_dialog = dm4c.ui.dialog({
                id: "color-dialog",
                title: "Set Color",
                content: content
            })
            color_dialog.open()

            function add_color_row(saturation, light) {
                for (var i = 4; i < 12; i++) {
                    add_color("hsl(" + [(45 * i + 30) % 360, saturation, light] + ")")
                }
                content = content.add($("<br>").attr("clear", "all"))
            }

            function add_color(color) {
                var color_box = $("<div>").addClass("color-box").css("background-color", color).click(function() {
                    var view_props = {}
                    view_props[PROP_COLOR] = color
                    canvas_view.set_view_properties(topic.id, view_props)
                    color_dialog.destroy()
                })
                if (color == current_color) {
                    color_box.addClass("selected")
                }
                content = content.add(color_box)
            }
        }
    })

    // ------------------------------------------------------------------------------------------------- Private Classes

    function BoxView(_canvas_view) {

        var ICON_SCALE_FACTOR = 2
        var ICON_OFFSET_FACTOR = 1.5

        // widen scope
        canvas_view = _canvas_view



        // === Hook Implementations ===

        this.topic_dom = function(topic_view) {
            topic_view.dom.append($("<div>").addClass("topic-label"))
            if (topic_view.type_uri == "dm4.notes.note") {
                topic_view.dom.append($("<div>").addClass("topic-content"))
                add_expansion_handle()
            }
            // Note: setting the content gives the topic DOM its size which is required by the framework
            // in order to position the topic
            sync_topic_content(topic_view)
            // Note: the type icon is only created in on_update_topic() which is fired right after topic_dom().
            // We must recreate the type icon in on_update_topic() anyway as the icon size may change through retyping.

            function add_expansion_handle() {
                topic_view.dom.append($("<img>").addClass("expansion-handle")
                    .click(function(event) {
                        var expanded = topic_view.view_props[PROP_EXPANDED]
                        var view_props = {}
                        view_props[PROP_EXPANDED] = !expanded
                        canvas_view.set_view_properties(topic_view.id, view_props)
                    })
                    .mouseup(function() {
                        return false    // avoids the topic from being selected
                    })
                    .mousedown(function() {
                        return false    // avoids the browser from dragging an icon copy
                    })
                )
            }
        }

        this.topic_dom_draggable_handle = function(topic_dom, handles) {
            handles.push($(".topic-label, .topic-content", topic_dom))
        }

        // ---

        /**
         * @param   topic_view      A TopicView object.
         *                          Has "id", "type_uri", "label", "x", "y", "view_props", "dom" properties
         *                          plus the viewmodel-derived custom properties.
         */
        this.on_update_topic = function(topic_view, ctx) {
            sync_topic_content(topic_view)
            sync_type_icon(topic_view)
        }

        this.on_update_view_properties = function(topic_view) {
            sync_background_color(topic_view)
            sync_view_expansion(topic_view)
        }

        // ---

        // Note: must explicitly order default behavoir. Otherwise associations are not selectable and the canvas
        // is not draggable. ### TODO: free the plugin developer from doing this
        this.on_mousedown = function(pos, modifier) {
            return true     // perform default behavoir
        }



        // === Private Methods ===

        function sync_topic_content(topic_view) {
            // label
            $(".topic-label", topic_view.dom).text(topic_view.label)
            // content
            if (topic_view.type_uri == "dm4.notes.note") {
                // Note: newly created topics have an empty composite
                var text = topic_view.composite["dm4.notes.text"]
                text && $(".topic-content", topic_view.dom).html(text.value)
            }
        }

        function sync_background_color(topic_view) {
            topic_view.dom.css("background-color", topic_view.view_props[PROP_COLOR])
        }

        function sync_view_expansion(topic_view) {
            var expanded = topic_view.view_props[PROP_EXPANDED]
            var expansion_handle = $(".expansion-handle", topic_view.dom)
            var topic_content = $(".topic-content", topic_view.dom)
            //
            expansion_handle.attr("src", expanded ? IMG_SRC_EXPANDED : IMG_SRC_COLLAPSED)
            topic_content.toggleClass("collapsed", !expanded)
            load_note()
            position_type_icon(topic_view)

            function load_note() {
                if (expanded && !topic_view.composite["dm4.notes.text"]) {
                    var note = dm4c.fetch_topic(topic_view.id)
                    canvas_view.update_topic(note)
                }
            }
        }

        function sync_type_icon(topic_view) {
            var topic_dom = topic_view.dom
            // remove existing type icon
            $(".type-icon", topic_dom).remove()
            // create new one (the icon size might have changed through retyping)
            var type_icon = $("<img>").addClass("type-icon")
            topic_dom.append(type_icon)
            set_src()
            set_size()
            position_type_icon(topic_view)
            add_event_handler()

            function set_src() {
                type_icon.attr("src", dm4c.get_type_icon_src(topic_view.type_uri))
            }

            function set_size() {
                type_icon.width(type_icon.width() / ICON_SCALE_FACTOR)  // the image height is scaled proportionally
            }

            function add_event_handler() {
                type_icon.mousedown(function(event) {
                    // ### TODO: framework must close_context_menu()
                    var pos = canvas_view.pos(event)
                    dm4c.do_select_topic(topic_view.id)
                    dm4c.topicmap_renderer.begin_association(topic_view.id, pos.x, pos.y)
                    return false    // avoids the browser from dragging an icon copy
                })
            }
        }

        function position_type_icon(topic_view) {
            var topic_dom = topic_view.dom
            var type_icon = $(".type-icon", topic_dom)
            type_icon.css({
                top:  Math.floor(topic_dom.outerHeight() - type_icon.height() / ICON_OFFSET_FACTOR),
                left: Math.floor(topic_dom.outerWidth()  - type_icon.width()  / ICON_OFFSET_FACTOR)
            })
        }
    }

    function BoxViewmodel() {

        this.enrich_view_properties = function(topic, view_props) {
            view_props[PROP_COLOR] = DEFAULT_TOPIC_COLOR
        }
    }
})
