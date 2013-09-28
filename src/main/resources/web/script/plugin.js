dm4c.add_plugin("de.deepamehta.boxrenderer", function() {

    // === Webclient Listeners ===

    /**
     * Note: the Topicmaps plugin instantiates the topicmap renderers (as provided by the
     * installed plugins) at "init" time. Registering our topicmap renderer customizer at
     * "init_2" ensures the respective topicmap renderer is available already.
     */
    dm4c.add_listener("init_2", function() {
        dm4c.get_plugin("de.deepamehta.topicmaps")
            .get_topicmap_renderer("dm4.webclient.default_topicmap_renderer")
            .add_customizer(BoxCustomizer)
    })

    // ------------------------------------------------------------------------------------------------- Private Classes

    var BOX_COLOR = "rgb(255, 207, 103)"
    var LABEL_COLOR = "black"
    var LABEL_LINE_HEIGHT = 19  // in pixel, 19px = 1.2em

    function BoxCustomizer(canvas_topics, canvas_assocs) {

        /**
         * Adds "width" and "height" properties to the topic view. The CanvasView relies on these for click detection.
         * Adds "label_wrapper" proprietary property.
         * Adds "box_pos", label_pos_y" proprietary property. Updated on topic move.
         *
         * @param   tv      A TopicView object (defined in CanvasView),
         *                  has "id", "type_uri", "label", "x", "y" properties.
         */
        this.update_topic = function(tv, ctx) {
            init_label(tv, ctx)
            init_pos(tv)
        }

        this.move_topic = function(tv) {
            init_pos(tv)
        }

        this.draw_topic = function(tv, ctx) {
            // box
            ctx.fillStyle = BOX_COLOR
            ctx.fillRect(tv.box_pos.x, tv.box_pos.y, tv.width, tv.height)
            // label
            ctx.fillStyle = LABEL_COLOR
            tv.label_wrapper.draw(tv.box_pos.x, tv.label_pos_y, ctx)
        }
    }

    // ----------------------------------------------------------------------------------------------- Private Functions

    function init_label(tv, ctx) {
        var label = js.truncate(tv.label, dm4c.MAX_TOPIC_LABEL_CHARS)
        tv.label_wrapper = new js.TextWrapper(label, dm4c.MAX_TOPIC_LABEL_WIDTH, LABEL_LINE_HEIGHT, ctx)
        var size = tv.label_wrapper.get_size()
        tv.width = Math.max(size.width, LABEL_LINE_HEIGHT)
        tv.height = Math.max(size.height, LABEL_LINE_HEIGHT)
    }

    function init_pos(tv) {
        tv.box_pos = {
            x: tv.x - tv.width / 2,
            y: tv.y - tv.height / 2
        }
        tv.label_pos_y = tv.box_pos.y + LABEL_LINE_HEIGHT - 4
    }
})
