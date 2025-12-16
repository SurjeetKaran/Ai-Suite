import { useEffect } from "react";
import log from "../utils/logger";

const SocialPopupHandler = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const role = params.get("role") || "user";
    const userString = params.get("user");

    let user = null;

    try {
      // Decode & parse user JSON coming from backend redirect
      user = userString ? JSON.parse(decodeURIComponent(userString)) : null;
    } catch (err) {
      log('ERROR', 'Failed to parse user data from OAuth', err?.message || err);
    }

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "SOCIAL_LOGIN_SUCCESS",
          token,
          role,
          user
        },
        "*"
      );

      window.close(); // Close popup
    }
  }, []);

  return (
    <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
      Completing sign-in…
    </div>
  );
};

export default SocialPopupHandler;

