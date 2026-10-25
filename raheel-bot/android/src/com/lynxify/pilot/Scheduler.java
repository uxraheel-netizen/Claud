package com.lynxify.pilot;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Reminders are a list of {at, title, body} pushed from the web app. One alarm is kept armed
 * for the earliest pending item; when it fires we notify and arm the next one, so reminders
 * keep coming even when the app is closed. Newer-API calls go through reflection because we
 * compile against the android-23 platform.
 */
final class Scheduler {
    static final String CHANNEL = "pilot_reminders";
    private static final int FLAG_IMMUTABLE = 0x04000000;
    private static final long STALE_MS = 30 * 60 * 1000L;

    private Scheduler() { }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("pilot", Context.MODE_PRIVATE);
    }

    static void save(Context c, String json) {
        prefs(c).edit().putString("items", json).apply();
    }

    private static JSONArray items(Context c) {
        try { return new JSONArray(prefs(c).getString("items", "[]")); }
        catch (Exception e) { return new JSONArray(); }
    }

    static void scheduleNext(Context c) {
        long now = System.currentTimeMillis();
        long last = prefs(c).getLong("lastFired", 0);
        long next = Long.MAX_VALUE;
        JSONArray arr = items(c);
        for (int i = 0; i < arr.length(); i++) {
            long at = arr.optJSONObject(i).optLong("at", 0);
            if (at > last && at > now - 60000 && at < next) next = at;
        }
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = alarmIntent(c);
        am.cancel(pi);
        if (next == Long.MAX_VALUE) return;
        try { am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi); }
        catch (SecurityException e) { am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi); }
    }

    static void fireDue(Context c) {
        long now = System.currentTimeMillis();
        SharedPreferences p = prefs(c);
        long last = p.getLong("lastFired", 0);
        long newest = last;
        JSONArray arr = items(c);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            long at = o.optLong("at", 0);
            if (at > last && at <= now + 60000) {
                if (now - at < STALE_MS) show(c, o.optString("title"), o.optString("body"), (int) ((at / 60000) % 100000));
                if (at > newest) newest = at;
            }
        }
        p.edit().putLong("lastFired", newest).apply();
        scheduleNext(c);
    }

    private static PendingIntent alarmIntent(Context c) {
        Intent i = new Intent(c, AlarmReceiver.class);
        return PendingIntent.getBroadcast(c, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            Class<?> ch = Class.forName("android.app.NotificationChannel");
            Object channel = ch.getConstructor(String.class, CharSequence.class, int.class)
                    .newInstance(CHANNEL, "Routine reminders", 4 /* IMPORTANCE_HIGH */);
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationManager.class.getMethod("createNotificationChannel", ch).invoke(nm, channel);
        } catch (Exception ignored) { }
    }

    static void show(Context c, String title, String body, int id) {
        ensureChannel(c);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                b = (Notification.Builder) Notification.Builder.class
                        .getConstructor(Context.class, String.class).newInstance(c, CHANNEL);
            } catch (Exception e) { b = new Notification.Builder(c); }
        } else {
            b = new Notification.Builder(c);
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
        b.setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setColor(0xFF7C5CFF)
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setContentIntent(pi);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        try { nm.notify(id, b.build()); } catch (SecurityException ignored) { }
    }
}
