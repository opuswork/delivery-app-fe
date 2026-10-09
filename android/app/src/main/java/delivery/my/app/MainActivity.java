package delivery.my.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import delivery.my.app.widget.MalloWidgetPlugin;

public class MainActivity extends BridgeActivity {

    /**
     * The web view scales text by the phone's font size (up to 200%). The app's
     * text is already large, and above 130% the calendar no longer fits a phone
     * screen, so larger settings are shown at 130%.
     */
    private static final int MAX_TEXT_ZOOM = 130;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugins must be registered before the bridge starts.
        registerPlugin(MalloWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        WebSettings settings = getBridge().getWebView().getSettings();
        if (settings.getTextZoom() > MAX_TEXT_ZOOM) settings.setTextZoom(MAX_TEXT_ZOOM);
    }
}
