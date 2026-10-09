package delivery.my.app.widget;

import delivery.my.app.BuildConfig;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * The few API calls the widget makes. It signs in with the same device key
 * as the app, so it sees the same account. Runs on a background thread only.
 */
final class DeliveryApi {

    /** Production backend in release builds; this computer in debug builds (app/build.gradle). */
    private static final String API_BASE = BuildConfig.WIDGET_API_BASE;
    /** Render's free plan can take most of a minute to wake up. */
    private static final int TIMEOUT_MS = 70_000;

    static final class UnauthorizedException extends IOException {

        UnauthorizedException() {
            super("401");
        }
    }

    private DeliveryApi() {}

    /** POST /auth/device → access token (creates the account if needed). */
    static String authenticate(String deviceKey) throws IOException, JSONException {
        String body = new JSONObject().put("deviceKey", deviceKey).toString();
        String response = request("POST", "/auth/device", null, body);
        return new JSONObject(response).getString("accessToken");
    }

    /** GET /deliveries?month=yyyy-MM. */
    static JSONArray listDeliveries(String token, String month) throws IOException, JSONException {
        return new JSONArray(request("GET", "/deliveries?month=" + month, token, null));
    }

    private static String request(String method, String path, String token, String body) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(API_BASE + path).openConnection();
        try {
            connection.setRequestMethod(method);
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setRequestProperty("Accept", "application/json");
            if (token != null) connection.setRequestProperty("Authorization", "Bearer " + token);
            if (body != null) {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                try (OutputStream out = connection.getOutputStream()) {
                    out.write(body.getBytes(StandardCharsets.UTF_8));
                }
            }
            int status = connection.getResponseCode();
            if (status == 401) throw new UnauthorizedException();
            if (status < 200 || status >= 300) throw new IOException("HTTP " + status);
            try (InputStream in = connection.getInputStream()) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                for (int read; (read = in.read(buffer)) != -1; ) bytes.write(buffer, 0, read);
                return bytes.toString("UTF-8");
            }
        } finally {
            connection.disconnect();
        }
    }
}
