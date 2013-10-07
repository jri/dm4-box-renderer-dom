package de.deepamehta.plugins.boxrenderer;

import de.deepamehta.core.osgi.PluginActivator;

import de.deepamehta.plugins.topicmaps.ViewmodelCustomizer;
import de.deepamehta.plugins.topicmaps.service.TopicmapsService;

import de.deepamehta.core.Topic;
import de.deepamehta.core.model.CompositeValueModel;
import de.deepamehta.core.service.PluginService;
import de.deepamehta.core.service.annotation.ConsumesService;



public class BoxRendererPlugin extends PluginActivator implements ViewmodelCustomizer {



    // ******************************************
    // *** ViewmodelCustomizer Implementation ***
    // ******************************************



    @Override
    public void modifyViewProperties(Topic topic, CompositeValueModel viewProps) {
        // use the topic to navigate the DB and/or fetch properties
        //
        viewProps.put("dm4.boxrenderer.color", "rgb(154, 216, 255)");
        viewProps.put("dm4.boxrenderer.shape", "rectangle");
    }



    // ****************************
    // *** Hook Implementations ***
    // ****************************



    @Override
    @ConsumesService("de.deepamehta.plugins.topicmaps.service.TopicmapsService")
    public void serviceArrived(PluginService service) {
        ((TopicmapsService) service).registerViewmodelCustomizer(this);
    }
}
