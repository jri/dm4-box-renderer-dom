dm4c.add_plugin("de.deepamehta.box-renderer-html", function() {

    var PROP_COLOR = "dm4.boxrenderer.color"
    var PROP_SHAPE = "dm4.boxrenderer.shape"

    var _canvas_view

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

            var current_color = _canvas_view.get_topic(topic.id).view_props[PROP_COLOR]
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
                    _canvas_view.set_view_properties(topic.id, view_props)
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

    function BoxView(canvas_view) {

        var ICON_SCALE_FACTOR = 2
        var ICON_OFFSET_FACTOR = 1.5

        _canvas_view = canvas_view

        // ---

        this.topic_dom = function(topic_view, topic_dom) {
            topic_dom.append($("<div>").addClass("topic-label"))
            set_topic_label(topic_dom, topic_view.label)
            set_background_color(topic_dom, topic_view.view_props[PROP_COLOR])
        }

        this.topic_dom_appendix = function(topic_view, topic_dom) {
            var mini_icon = $("<img>").addClass("mini-icon")
                .mousedown(function(event) {
                    // ### close_context_menu()
                    var pos = canvas_view.pos(event)
                    dm4c.do_select_topic(topic_view.id)
                    dm4c.topicmap_renderer.begin_association(topic_view.id, pos.x, pos.y)
                    return false    // avoids the browser from dragging an icon copy
                })
            topic_dom.append(mini_icon)
            set_mini_icon_src(mini_icon, topic_view.type_uri)
            mini_icon.width(mini_icon.width() / ICON_SCALE_FACTOR)  // the image height is scaled proportionally
            // ### TODO: scaling should perform on update_topic() as well. But the icon would shrink each time
            // it is updated (scaling is relative). We could create a new <img> element each time. Better would
            // be not to scale the <img> element but the underlying JavaScript Image object.
        }

        this.topic_dom_draggable_handle = function(topic_dom, handles) {
            handles.push($(".topic-label", topic_dom))
        }

        // ---

        // Note: must explicitly order default behavoir. Otherwise associations are not selectable and the canvas
        // is not draggable. ### TODO: free the plugin developer from doing this
        this.on_mousedown = function(pos, modifier) {
            return true     // perform default behavoir
        }

        // ---

        /**
         * @param   topic_view      A TopicView object.
         *                          Has "id", "type_uri", "label", "x", "y", "dom" properties
         *                          plus the custom view properties.
         */
        this.update_topic = function(topic_view, ctx) {
            var tv = topic_view
            // label
            set_topic_label(tv.dom, tv.label)
            // mini icon
            var mini_icon = $(".mini-icon", tv.dom)
            set_mini_icon_src(mini_icon, tv.type_uri)
            set_mini_icon_position(mini_icon, tv.dom)
        }

        this.update_view_properties = function(topic_view) {
            set_background_color(topic_view.dom, topic_view.view_props[PROP_COLOR])
        }

        // ---

        function set_topic_label(topic_dom, label) {
            $(".topic-label", topic_dom).text(label)
        }

        function set_background_color(topic_dom, color) {
            topic_dom.css("background-color", color)
        }

        function set_mini_icon_src(mini_icon, type_uri) {
            mini_icon.attr("src", dm4c.get_type_icon_src(type_uri))
        }

        function set_mini_icon_position(mini_icon, topic_dom) {
            mini_icon.css({
                top:  topic_dom.outerHeight() - mini_icon.height() / ICON_OFFSET_FACTOR,
                left: topic_dom.outerWidth()  - mini_icon.width()  / ICON_OFFSET_FACTOR
            })
        }
    }

    function BoxViewmodel() {

        var DEFAULT_COLOR = "hsl(210,100%,90%)"     // must match server-side (see BoxRendererPlugin.java)
                                                    // must match top/left in color dialog (see below)

        this.enrich_view_properties = function(topic, view_props) {
            view_props[PROP_COLOR] = DEFAULT_COLOR
            view_props[PROP_SHAPE] = "rectangle"    // not used. Just for illustration purpose.
        }
    }
})
