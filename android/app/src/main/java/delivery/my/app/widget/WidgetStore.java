package delivery.my.app.widget;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.Calendar;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * The widget's own storage: which month each widget shows, the last fetched
 * deliveries per month (shown offline and while refreshing), and the API token.
 */
final class WidgetStore {

    /** Where @capacitor/preferences keeps values (its default group). */
    private static final String CAPACITOR_PREFS = "CapacitorStorage";
    /** Written by fe/lib/device-key.ts the first time the app is opened. */
    private static final String DEVICE_KEY = "voice-delivery.deviceKey";

    private static final String PREFS = "mallo_calendar_widget";
    private static final String MONTH_PREFIX = "month_of_";
    private static final String DATA_PREFIX = "data_";
    private static final String FAILED_PREFIX = "failed_";
    private static final String TOKEN = "token";

    private final SharedPreferences prefs;
    private final SharedPreferences capacitorPrefs;

    WidgetStore(Context context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        capacitorPrefs = context.getSharedPreferences(CAPACITOR_PREFS, Context.MODE_PRIVATE);
    }

    /** "yyyy-MM" of today. */
    static String currentMonth() {
        Calendar now = Calendar.getInstance();
        return monthKey(now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1);
    }

    static String monthKey(int year, int month) {
        return String.format(Locale.US, "%04d-%02d", year, month);
    }

    /** "yyyy-MM" moved by `delta` months. */
    static String addMonths(String month, int delta) {
        int year = Integer.parseInt(month.substring(0, 4));
        int index = year * 12 + Integer.parseInt(month.substring(5, 7)) - 1 + delta;
        return monthKey(index / 12, index % 12 + 1);
    }

    /** Null when the app has never been opened on this device. */
    String deviceKey() {
        return capacitorPrefs.getString(DEVICE_KEY, null);
    }

    String monthOf(int widgetId) {
        return prefs.getString(MONTH_PREFIX + widgetId, currentMonth());
    }

    void setMonth(int widgetId, String month) {
        prefs.edit().putString(MONTH_PREFIX + widgetId, month).apply();
    }

    void forget(int widgetId) {
        prefs.edit().remove(MONTH_PREFIX + widgetId).apply();
    }

    /** date ("yyyy-MM-dd") → [[납품처, badge colour], …]; null when never fetched. */
    JSONObject deliveries(String month) {
        String raw = prefs.getString(DATA_PREFIX + month, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    /** Groups the API's records (GET /deliveries?month=) by date and caches them. */
    void saveDeliveries(String month, JSONArray records) throws JSONException {
        JSONObject byDate = new JSONObject();
        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.getJSONObject(i);
            String date = record.getString("delivery_date");
            JSONArray day = byDate.optJSONArray(date);
            if (day == null) {
                day = new JSONArray();
                byDate.put(date, day);
            }
            day.put(new JSONArray().put(record.optString("company_name")).put(record.optString("badge_color")));
        }
        prefs.edit().putString(DATA_PREFIX + month, byDate.toString()).remove(FAILED_PREFIX + month).apply();
    }

    void setFailed(String month) {
        prefs.edit().putBoolean(FAILED_PREFIX + month, true).apply();
    }

    boolean failed(String month) {
        return prefs.getBoolean(FAILED_PREFIX + month, false);
    }

    String token() {
        return prefs.getString(TOKEN, null);
    }

    void setToken(String token) {
        prefs.edit().putString(TOKEN, token).apply();
    }
}
