dm4c.add_plugin("de.deepamehta.boxrenderer", function() {

    var BOX_COLOR = "rgb(255, 207, 103)"
    var LABEL_COLOR = "black"

    function BoxCustomizer(canvas_topics, canvas_assocs) {

        this.draw_topic = function(ct, ctx) {
            var size = ct.label_wrapper.get_size()
            var line_height = ct.label_wrapper.get_line_height()
            var width = Math.max(size.width, line_height)
            var height = Math.max(size.height, line_height)
            var x = ct.x - width / 2
            var y = ct.y - height / 2
            // box
            ctx.fillStyle = BOX_COLOR
            ctx.fillRect(x, y, width, height)
            // label
            ctx.fillStyle = LABEL_COLOR
            ct.label_wrapper.draw(x, y + line_height - 4, ctx)
        }
    }

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
})
