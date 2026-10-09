package delivery.my.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import delivery.my.app.R;
import java.util.Calendar;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen month calendar, like the app's: 납품처 chips in their badge
 * colour on each day, "+N" for the rest. ‹ › change the month, the day box
 * returns to this month, and "+" or any day opens the app.
 *
 * Drawing uses cached data only; RefreshWorker fetches in the background and
 * draws again. The app asks for a refresh after it saves (MalloWidgetPlugin).
 */
public class CalendarWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_PREV = "delivery.my.app.widget.PREV";
    private static final String ACTION_NEXT = "delivery.my.app.widget.NEXT";
    private static final String ACTION_TODAY = "delivery.my.app.widget.TODAY";

    /** fe/lib/constants/delivery.ts DEFAULT_BADGE_COLOR. */
    private static final String DEFAULT_BADGE_COLOR = "#1DA1F2";
    private static final int[] CHIP_IDS = { R.id.day_chip_1, R.id.day_chip_2, R.id.day_chip_3 };

    // Heights in dp, matching the layouts, used to decide how many chips fit.
    private static final int FRAME_DP = 8 + 8 + 40 + 22;
    private static final int STATUS_DP = 16;
    private static final int DAY_NUMBER_DP = 19;
    private static final int CHIP_DP = 15;
    private static final int MORE_DP = 12;

    /** Draws every widget again from the cache, then fetches fresh data. */
    public static void refresh(Context context) {
        int[] ids = widgetIds(context);
        if (ids.length == 0) return;
        drawAll(context, ids);
        RefreshWorker.enqueue(context);
    }

    static int[] widgetIds(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        return manager.getAppWidgetIds(new ComponentName(context, CalendarWidgetProvider.class));
    }

    static void drawAll(Context context, int[] ids) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        WidgetStore store = new WidgetStore(context);
        for (int id : ids) manager.updateAppWidget(id, render(context, manager, store, id));
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        // Also runs every 30 minutes, which keeps "today" current.
        drawAll(context, ids);
        RefreshWorker.enqueue(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        // Resized: the number of chips per day may change.
        manager.updateAppWidget(id, render(context, manager, new WidgetStore(context), id));
    }

    @Override
    public void onDeleted(Context context, int[] ids) {
        WidgetStore store = new WidgetStore(context);
        for (int id : ids) store.forget(id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (action == null || id == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        WidgetStore store = new WidgetStore(context);
        String month = store.monthOf(id);
        switch (action) {
            case ACTION_PREV:
                store.setMonth(id, WidgetStore.addMonths(month, -1));
                break;
            case ACTION_NEXT:
                store.setMonth(id, WidgetStore.addMonths(month, 1));
                break;
            case ACTION_TODAY:
                store.setMonth(id, WidgetStore.currentMonth());
                break;
            default:
                return;
        }
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        manager.updateAppWidget(id, render(context, manager, store, id));
        RefreshWorker.enqueue(context);
    }

    private static RemoteViews render(Context context, AppWidgetManager manager, WidgetStore store, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);
        String month = store.monthOf(id);
        int year = Integer.parseInt(month.substring(0, 4));
        int monthNumber = Integer.parseInt(month.substring(5, 7));
        Calendar today = Calendar.getInstance();
        int todayYear = today.get(Calendar.YEAR);
        String todayKey = String.format(
            Locale.US,
            "%04d-%02d-%02d",
            todayYear,
            today.get(Calendar.MONTH) + 1,
            today.get(Calendar.DAY_OF_MONTH)
        );

        views.setTextViewText(R.id.widget_month, year == todayYear ? monthNumber + "월" : year + "년 " + monthNumber + "월");
        views.setTextViewText(R.id.widget_today, String.valueOf(today.get(Calendar.DAY_OF_MONTH)));
        views.setOnClickPendingIntent(R.id.widget_prev, actionIntent(context, ACTION_PREV, id));
        views.setOnClickPendingIntent(R.id.widget_next, actionIntent(context, ACTION_NEXT, id));
        views.setOnClickPendingIntent(R.id.widget_today, actionIntent(context, ACTION_TODAY, id));
        views.setOnClickPendingIntent(R.id.widget_add, openAppIntent(context, id * 100));
        views.setOnClickPendingIntent(R.id.widget_month, openAppIntent(context, id * 100 + 99));

        JSONObject deliveries = store.deliveries(month);
        String status = null;
        if (store.deviceKey() == null) status = context.getString(R.string.widget_open_app_first);
        else if (deliveries == null) status = context.getString(
            store.failed(month) ? R.string.widget_offline : R.string.widget_loading
        );
        else if (store.failed(month)) status = context.getString(R.string.widget_offline);
        views.setViewVisibility(R.id.widget_status, status == null ? View.GONE : View.VISIBLE);
        if (status != null) views.setTextViewText(R.id.widget_status, status);

        Calendar first = Calendar.getInstance();
        first.clear();
        first.set(year, monthNumber - 1, 1);
        int leading = first.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY;
        int daysInMonth = first.getActualMaximum(Calendar.DAY_OF_MONTH);
        int weeks = (leading + daysInMonth + 6) / 7;

        // How many 15dp chips fit under the day number in one row.
        Bundle options = manager.getAppWidgetOptions(id);
        int heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (heightDp == 0) heightDp = 250;
        int rowDp = (heightDp - FRAME_DP - (status == null ? 0 : STATUS_DP)) / weeks - 1;
        int chipsWhenAllFit = clamp((rowDp - DAY_NUMBER_DP) / CHIP_DP);
        int chipsWithMore = clamp((rowDp - DAY_NUMBER_DP - MORE_DP) / CHIP_DP);

        views.removeAllViews(R.id.widget_grid);
        for (int week = 0; week < weeks; week++) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_week_row);
            for (int weekday = 0; weekday < 7; weekday++) {
                int day = week * 7 + weekday - leading + 1;
                RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_day_cell);
                if (day >= 1 && day <= daysInMonth) {
                    String key = String.format(Locale.US, "%s-%02d", month, day);
                    JSONArray records = deliveries == null ? null : deliveries.optJSONArray(key);
                    drawDay(context, cell, day, weekday, key, todayKey, records, chipsWhenAllFit, chipsWithMore);
                    cell.setOnClickPendingIntent(R.id.day_cell, openAppIntent(context, id * 100 + day));
                }
                row.addView(R.id.widget_week, cell);
            }
            views.addView(R.id.widget_grid, row);
        }
        return views;
    }

    private static void drawDay(
        Context context,
        RemoteViews cell,
        int day,
        int weekday,
        String key,
        String todayKey,
        JSONArray records,
        int chipsWhenAllFit,
        int chipsWithMore
    ) {
        cell.setTextViewText(R.id.day_number, String.valueOf(day));
        cell.setTextColor(R.id.day_number, dayColor(context, weekday, key.compareTo(todayKey) < 0));
        if (key.equals(todayKey)) cell.setInt(R.id.day_cell, "setBackgroundResource", R.drawable.widget_today);

        int count = records == null ? 0 : records.length();
        int shown = count <= chipsWhenAllFit ? count : chipsWithMore;
        for (int i = 0; i < shown; i++) {
            JSONArray record = records.optJSONArray(i);
            String company = record.optString(0);
            String color = record.optString(1);
            int background = parseColor(color.isEmpty() ? DEFAULT_BADGE_COLOR : color);
            int chip = CHIP_IDS[i];
            cell.setViewVisibility(chip, View.VISIBLE);
            cell.setTextViewText(chip, company.isEmpty() ? "배달" : company);
            cell.setTextColor(chip, textColorOn(background));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                cell.setColorStateList(chip, "setBackgroundTintList", ColorStateList.valueOf(background));
            } else {
                cell.setInt(chip, "setBackgroundColor", background);
            }
        }
        if (count > shown) {
            cell.setViewVisibility(R.id.day_more, View.VISIBLE);
            cell.setTextViewText(R.id.day_more, "+" + (count - shown));
        }
    }

    /** Same colours as the app's calendar (CalendarDay.tsx). */
    private static int dayColor(Context context, int weekday, boolean past) {
        if (weekday == 0) return context.getColor(R.color.widget_sunday);
        if (weekday == 6) return context.getColor(R.color.widget_saturday);
        return context.getColor(past ? R.color.widget_text_muted : R.color.widget_text);
    }

    /** Dark text on light badge colours (yellow, grey), white on the rest. */
    private static int textColorOn(int color) {
        double luminance = (0.2126 * Color.red(color) + 0.7152 * Color.green(color) + 0.0722 * Color.blue(color)) / 255;
        return luminance > 0.6 ? Color.parseColor("#1E293B") : Color.WHITE;
    }

    private static int parseColor(String hex) {
        try {
            return Color.parseColor(hex);
        } catch (IllegalArgumentException e) {
            return Color.parseColor(DEFAULT_BADGE_COLOR);
        }
    }

    private static int clamp(int chips) {
        return Math.max(0, Math.min(CHIP_IDS.length, chips));
    }

    private static PendingIntent actionIntent(Context context, String action, int id) {
        Intent intent = new Intent(context, CalendarWidgetProvider.class)
            .setAction(action)
            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        int requestCode = (action + id).hashCode();
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openAppIntent(Context context, int requestCode) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intent == null) intent = new Intent();
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
