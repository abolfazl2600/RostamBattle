package io.github.abolfazl.nabardrostam;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

// Native Activity provides Back + lifecycle signals without adding a Play
// Services / App plugin dependency. Web logic remains the sole UI state owner.
public class MainActivity extends BridgeActivity {
    private void signal(String name) {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('" + name + "'));", null
            );
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge == null || bridge.getWebView() == null) return;
                bridge.getWebView().evaluateJavascript(
                    "(function(){return typeof window.__rostamNativeBack === 'function' " +
                    "? window.__rostamNativeBack() : 'handled';})()",
                    result -> {
                        // Only the explicit second Back from the title can exit.
                        if ("\"exit\"".equals(result) && !isFinishing()) finish();
                    }
                );
            }
        });
    }

    @Override protected void onPause() {
        signal("rostam:native-pause");
        super.onPause();
    }

    @Override protected void onStop() {
        signal("rostam:native-stop");
        super.onStop();
    }

    @Override protected void onResume() {
        super.onResume();
        signal("rostam:native-resume");
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        signal(hasFocus ? "rostam:native-focus" : "rostam:native-blur");
    }
}
