dm4c.add_plugin("de.deepamehta.boxrenderer", function() {

    var BOX_COLOR = "rgb(255, 207, 103)"
    var LABEL_COLOR = "black"

    function BoxCustomizer(canvas_topics, canvas_assocs) {

        this.create_topic = function(topic_viewmodel, ctx) {
            return new TopicView(topic_viewmodel, ctx)
        }

        this.draw_topic = function(ct, ctx) {
            var x = ct.x - ct.width / 2
            var y = ct.y - ct.height / 2
            // box
            ctx.fillStyle = BOX_COLOR
            ctx.fillRect(x, y, ct.width, ct.height)
            // label
            var line_height = ct.label_wrapper.get_line_height()
            ctx.fillStyle = LABEL_COLOR
            ct.label_wrapper.draw(x, y + line_height - 4, ctx)
        }

        /**
         * Properties:
         *  id
         *  x, y                    Topic position. Represents the center of the topic's icon.
         *  width, height           Box size.
         *  label_wrapper
         *
         * @param   topic   A TopicViewmodel.
         */
        function TopicView(topic, ctx) {

            var self = this

            this.id = topic.id
            this.x = topic.x
            this.y = topic.y

            init(topic);

            // ---

            this.move_by = function(dx, dy) {
                this.x += dx
                this.y += dy
            }

            /**
             * @param   topic   A TopicViewmodel.
             */
            this.update = function(topic) {
                init(topic)
            }

            // ---

            function init(topic) {
                var label = js.truncate(topic.label, dm4c.MAX_TOPIC_LABEL_CHARS)
                self.label_wrapper = new js.TextWrapper(label, dm4c.MAX_TOPIC_LABEL_WIDTH, 19, ctx)
                                                                        // line height 19px = 1.2em
                //
                var size = self.label_wrapper.get_size()
                var line_height = self.label_wrapper.get_line_height()
                self.width = Math.max(size.width, line_height)
                self.height = Math.max(size.height, line_height)
                
            }
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
