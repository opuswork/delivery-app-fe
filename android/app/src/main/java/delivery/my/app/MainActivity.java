package delivery.my.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import delivery.my.app.widget.MalloWidgetPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugins must be registered before the bridge starts.
        registerPlugin(MalloWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
