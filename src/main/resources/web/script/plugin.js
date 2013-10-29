dm4c.add_plugin("de.deepamehta.box-renderer-dom", function() {

    var DEFAULT_TOPIC_COLOR = "hsl(210,100%,90%)"   // must match server-side (see BoxRendererPlugin.java)
                                                    // must match top/left color in color dialog (see below)

    var PROP_COLOR = "dm4.boxrenderer.color"
    var PROP_SHAPE = "dm4.boxrenderer.shape"

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
            // Note: setting the label gives the topic DOM its size which is required by the framework
            // in order to position the topic
            sync_topic_label(topic_view)
            sync_background_color(topic_view)
            // Note: the mini icon is only created in on_update_topic() which is fired right after topic_dom().
            // We must recreate the mini icon in on_update_topic() anyway as the icon size may change through retyping.
        }

        this.topic_dom_draggable_handle = function(topic_dom, handles) {
            handles.push($(".topic-label", topic_dom))
        }

        // ---

        /**
         * @param   topic_view      A TopicView object.
         *                          Has "id", "type_uri", "label", "x", "y", "view_props", "dom" properties
         *                          plus the viewmodel-derived custom properties.
         */
        this.on_update_topic = function(topic_view, ctx) {
            sync_topic_label(topic_view)
            sync_mini_icon(topic_view)
        }

        this.on_update_view_properties = function(topic_view) {
            sync_background_color(topic_view)
        }

        // ---

        // Note: must explicitly order default behavoir. Otherwise associations are not selectable and the canvas
        // is not draggable. ### TODO: free the plugin developer from doing this
        this.on_mousedown = function(pos, modifier) {
            return true     // perform default behavoir
        }



        // === Private Methods ===

        function sync_topic_label(topic_view) {
            $(".topic-label", topic_view.dom).text(topic_view.label)
        }

        function sync_background_color(topic_view) {
            topic_view.dom.css("background-color", topic_view.view_props[PROP_COLOR])
        }

        function sync_mini_icon(topic_view) {
            var topic_dom = topic_view.dom
            // remove existing mini icon
            $(".mini-icon", topic_dom).remove()
            // create new one (the icon size might have changed through retyping)
            var mini_icon = $("<img>").addClass("mini-icon")
            topic_dom.append(mini_icon)
            set_src()
            set_size()
            set_position()
            add_mouse_handler()

            function set_src() {
                mini_icon.attr("src", dm4c.get_type_icon_src(topic_view.type_uri))
            }

            function set_size() {
                mini_icon.width(mini_icon.width() / ICON_SCALE_FACTOR)  // the image height is scaled proportionally
            }

            function set_position() {
                mini_icon.css({
                    top:  topic_dom.outerHeight() - mini_icon.height() / ICON_OFFSET_FACTOR,
                    left: topic_dom.outerWidth()  - mini_icon.width()  / ICON_OFFSET_FACTOR
                })
            }

            function add_mouse_handler() {
                mini_icon.mousedown(function(event) {
                    // ### TODO: framework must close_context_menu()
                    var pos = canvas_view.pos(event)
                    dm4c.do_select_topic(topic_view.id)
                    dm4c.topicmap_renderer.begin_association(topic_view.id, pos.x, pos.y)
                    return false    // avoids the browser from dragging an icon copy
                })
            }
        }
    }

    function BoxViewmodel() {

        this.enrich_view_properties = function(topic, view_props) {
            view_props[PROP_COLOR] = DEFAULT_TOPIC_COLOR
            view_props[PROP_SHAPE] = "rectangle"    // not used. Just for illustration purpose.
        }
    }
})
