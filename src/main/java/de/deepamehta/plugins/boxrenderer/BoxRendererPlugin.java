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

    // must match client-side (see plugin.js)
    private String DEFAULT_COLOR = "hsl(210,100%,90%)";

    // -------------------------------------------------------------------------------------------------- Public Methods

    // *** Hook Implementations ***

    @Override
    @ConsumesService("de.deepamehta.plugins.topicmaps.service.TopicmapsService")
    public void serviceArrived(PluginService service) {
        ((TopicmapsService) service).registerViewmodelCustomizer(this);
    }

    // *** ViewmodelCustomizer Implementation ***

    @Override
    public void enrichViewProperties(Topic topic, CompositeValueModel viewProps) {
        String color, shape;
        if (topic.hasProperty("dm4.boxrenderer.color")) {
            // fetch props from DB
            color = (String) topic.getProperty("dm4.boxrenderer.color");
            shape = (String) topic.getProperty("dm4.boxrenderer.shape");
        } else {
            // set defaults
            color = DEFAULT_COLOR;
            shape = "rectangle";
            // store props in DB
            storeViewProperties(topic, color, shape);
        }
        // enrich view props
        viewProps.put("dm4.boxrenderer.color", color);
        viewProps.put("dm4.boxrenderer.shape", shape);  // not yet used at client-side. Just for illustration purpose.
    }

    @Override
    public void storeViewProperties(Topic topic, CompositeValueModel viewProps) {
        String color = viewProps.getString("dm4.boxrenderer.color", null);
        String shape = viewProps.getString("dm4.boxrenderer.shape", null);
        storeViewProperties(topic, color, shape);
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private void storeViewProperties(Topic topic, String color, String shape) {
        DeepaMehtaTransaction tx = dms.beginTx();
        try {
            if (color != null) {
                topic.setProperty("dm4.boxrenderer.color", color, false);   // addToIndex = false
            }
            if (shape != null) {
                topic.setProperty("dm4.boxrenderer.shape", shape, false);   // addToIndex = false
            }
            tx.success();
        } catch (Exception e) {
            throw new RuntimeException("Storing view properties failed", e);
        } finally {
            tx.finish();
        }
    }
}
