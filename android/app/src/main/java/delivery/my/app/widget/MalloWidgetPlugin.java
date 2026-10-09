package delivery.my.app.widget;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web app ask the home-screen widget to refresh (fe/lib/native/widget.ts). */
@CapacitorPlugin(name = "MalloWidget")
public class MalloWidgetPlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        CalendarWidgetProvider.refresh(getContext());
        call.resolve();
    }
}
