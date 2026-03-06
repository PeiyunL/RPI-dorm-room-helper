// ─────────────────────────────────────────────────────────────
// 1. Enforce @rpi.edu email on registration
// ─────────────────────────────────────────────────────────────
onRecordBeforeCreateRequest((e) => {
    const email = (e.record.get("email") || "").toLowerCase();
    if (!email.endsWith("@rpi.edu")) {
        throw new BadRequestError("Only @rpi.edu email addresses are allowed to register.");
    }
}, "users");

// ─────────────────────────────────────────────────────────────
// 2. Atomic like count – increment on like created
// ─────────────────────────────────────────────────────────────
onRecordAfterCreateRequest((e) => {
    const postId = e.record.get("post");
    if (!postId) return;
    try {
        const post = $app.dao().findRecordById("posts", postId);
        const current = post.getInt("likes");
        post.set("likes", current + 1);
        $app.dao().saveRecord(post);
    } catch (err) {
        console.log("likes increment error: " + err.message);
    }
}, "likes");

// ─────────────────────────────────────────────────────────────
// 3. Atomic like count – decrement on like deleted
// ─────────────────────────────────────────────────────────────
onRecordAfterDeleteRequest((e) => {
    const postId = e.record.get("post");
    if (!postId) return;
    try {
        const post = $app.dao().findRecordById("posts", postId);
        const current = post.getInt("likes");
        post.set("likes", Math.max(0, current - 1));
        $app.dao().saveRecord(post);
    } catch (err) {
        console.log("likes decrement error: " + err.message);
    }
}, "likes");

// ─────────────────────────────────────────────────────────────
// 4. Atomic comment count – increment on comment created
// ─────────────────────────────────────────────────────────────
onRecordAfterCreateRequest((e) => {
    const postId = e.record.get("post");
    if (!postId) return;
    try {
        const post = $app.dao().findRecordById("posts", postId);
        const current = post.getInt("commentsCount");
        post.set("commentsCount", current + 1);
        $app.dao().saveRecord(post);
    } catch (err) {
        console.log("commentsCount increment error: " + err.message);
    }
}, "comments");

// ─────────────────────────────────────────────────────────────
// 5. Atomic comment count – decrement on comment deleted
// ─────────────────────────────────────────────────────────────
onRecordAfterDeleteRequest((e) => {
    const postId = e.record.get("post");
    if (!postId) return;
    try {
        const post = $app.dao().findRecordById("posts", postId);
        const current = post.getInt("commentsCount");
        post.set("commentsCount", Math.max(0, current - 1));
        $app.dao().saveRecord(post);
    } catch (err) {
        console.log("commentsCount decrement error: " + err.message);
    }
}, "comments");

// ─────────────────────────────────────────────────────────────
// 6. Cascade delete user's posts when account is deleted
// ─────────────────────────────────────────────────────────────
onRecordAfterDeleteRequest((e) => {
    const userId = e.record.id;
    try {
        const posts = $app.dao().findRecordsByFilter(
            "posts", "author = '" + userId + "'", "", 0, 0
        );
        for (const post of posts) {
            $app.dao().deleteRecord(post);
        }
        console.log("Cascade deleted " + posts.length + " posts for user: " + userId);
    } catch (err) {
        console.log("Cascade delete posts error: " + err.message);
    }
}, "users");

// ─────────────────────────────────────────────────────────────
// 7. Cascade delete user's likes/favorites when account is deleted
// ─────────────────────────────────────────────────────────────
onRecordAfterDeleteRequest((e) => {
    const userId = e.record.id;
    const collections = ["likes", "favorites", "notifications", "login_logs"];
    for (const col of collections) {
        try {
            const records = $app.dao().findRecordsByFilter(
                col, "user = '" + userId + "'", "", 0, 0
            );
            for (const rec of records) {
                $app.dao().deleteRecord(rec);
            }
            console.log("Cascade deleted " + records.length + " records from " + col + " for user: " + userId);
        } catch (err) {
            // Collection may not exist — silently skip
        }
    }
}, "users");

// ─────────────────────────────────────────────────────────────
// 8. Reports count update (original hook – kept + hardened)
// ─────────────────────────────────────────────────────────────
onRecordAfterCreateRequest((e) => {
    const postId = e.record.get("post");
    if (!postId) return;
    try {
        const post = $app.dao().findRecordById("posts", postId);
        const reports = $app.dao().findRecordsByFilter(
            "reports", "post = '" + postId + "'", "-created", 0, 0
        );
        post.set("reportsCount", reports.length);
        $app.dao().saveRecord(post);

        // Auto-hide post if it reaches 10 reports
        if (reports.length >= 10) {
            post.set("hidden", true);
            $app.dao().saveRecord(post);
            console.log("Post auto-hidden due to reports threshold: " + postId);
        }

        console.log("reportsCount updated for post: " + postId + " → " + reports.length);
    } catch (err) {
        console.log("Hook Error: " + err.message);
    }
}, "reports");