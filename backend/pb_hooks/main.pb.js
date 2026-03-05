onRecordAfterCreateRequest((e) => {
    // Get the ID of the post from the new report record
    const postId = e.record.get("post");

    try {
        // 1. Fetch the post record
        const post = $app.dao().findRecordById("posts", postId);

        // 2. Count how many reports exist for this post ID
        // Note: we use {post: postId} as a filter object
        const reports = $app.dao().findRecordsByFilter("reports", "post = '" + postId + "'", "-created", 0, 0);

        // 3. Update the count
        post.set("reportsCount", reports.length);

        // 4. Save to DB
        $app.dao().saveRecord(post);
        
        console.log("Successfully updated reportsCount for post: " + postId + " to " + reports.length);
    } catch (err) {
        console.log("Hook Error: " + err.message);
    }
}, "reports");