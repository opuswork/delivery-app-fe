package delivery.my.app.widget;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;
import org.json.JSONException;

/**
 * Fetches the months the widgets show (and this month) and draws them again.
 * A Worker rather than the broadcast receiver, because the server can take
 * most of a minute to wake up.
 */
public class RefreshWorker extends Worker {

    private static final String WORK_NAME = "calendar-widget-refresh";
    private static final int MAX_ATTEMPTS = 3;

    public RefreshWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static void enqueue(Context context) {
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(RefreshWorker.class)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build();
        // A newer request (another month, a new save) replaces a pending one.
        WorkManager.getInstance(context).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        int[] ids = CalendarWidgetProvider.widgetIds(context);
        WidgetStore store = new WidgetStore(context);
        String deviceKey = store.deviceKey();
        if (ids.length == 0 || deviceKey == null) return Result.success();

        Set<String> months = new LinkedHashSet<>();
        for (int id : ids) months.add(store.monthOf(id));
        months.add(WidgetStore.currentMonth());

        boolean retry = false;
        for (String month : months) {
            if (isStopped()) return Result.success();
            try {
                fetch(store, deviceKey, month);
            } catch (IOException | JSONException e) {
                store.setFailed(month);
                retry = true;
            }
        }
        CalendarWidgetProvider.drawAll(context, ids);
        return retry && getRunAttemptCount() + 1 < MAX_ATTEMPTS ? Result.retry() : Result.success();
    }

    private static void fetch(WidgetStore store, String deviceKey, String month) throws IOException, JSONException {
        String token = store.token();
        if (token != null) {
            try {
                store.saveDeliveries(month, DeliveryApi.listDeliveries(token, month));
                return;
            } catch (DeliveryApi.UnauthorizedException expired) {
                // Tokens expire after a while; sign in again below.
            }
        }
        token = DeliveryApi.authenticate(deviceKey);
        store.setToken(token);
        store.saveDeliveries(month, DeliveryApi.listDeliveries(token, month));
    }
}
