package de.deepamehta.plugins.boxrenderer;

import de.deepamehta.core.osgi.PluginActivator;
import de.deepamehta.core.storage.spi.DeepaMehtaTransaction;

import de.deepamehta.plugins.topicmaps.ViewmodelCustomizer;
import de.deepamehta.plugins.topicmaps.service.TopicmapsService;

import de.deepamehta.core.Topic;
import de.deepamehta.core.model.CompositeValueModel;
import de.deepamehta.core.service.PluginService;
import de.deepamehta.core.service.annotation.ConsumesService;



public class BoxRendererPlugin extends PluginActivator implements ViewmodelCustomizer {

    // ------------------------------------------------------------------------------------------------------- Constants

    private String[] COLORS = {
        "rgb(154, 216, 255)",
        "rgb(216, 255, 154)",
        "rgb(255, 154, 216)"
    };

    // -------------------------------------------------------------------------------------------------- Public Methods



    // ******************************************
    // *** ViewmodelCustomizer Implementation ***
    // ******************************************



    @Override
    public void modifyViewProperties(Topic topic, CompositeValueModel viewProps) {
        String color, shape;
        if (topic.hasProperty("dm4.boxrenderer.color")) {
            // fetch props from DB
            color = (String) topic.getProperty("dm4.boxrenderer.color");
            shape = (String) topic.getProperty("dm4.boxrenderer.shape");
        } else {
            // store new props in DB
            color = COLORS[(int) (3 * Math.random())];
            shape = "rectangle";
            DeepaMehtaTransaction tx = dms.beginTx();
            try {
                topic.setProperty("dm4.boxrenderer.color", color, false);   // addToIndex = false
                topic.setProperty("dm4.boxrenderer.shape", shape, false);   // addToIndex = false
                tx.success();
            } catch (Exception e) {
                throw new RuntimeException("Storing view properties failed", e);
            } finally {
                tx.finish();
            }
        }
        // add to view props
        viewProps.put("dm4.boxrenderer.color", color);
        viewProps.put("dm4.boxrenderer.shape", shape);  // not yet used at client-side. Just for illustration purpose.
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
