"use server";

export async function scheduleMeeting(formData: FormData) {
    const name = formData.get("name");
    const brand = formData.get("brand");
    const email = formData.get("email");
    const category = formData.get("category");
    const date = formData.get("date");
    const time = formData.get("time");

    // Later: Store in Mongo, Send Email, Create Google Calendar Event
    console.log("New Seller Meeting Data Logged:", {
        name,
        brand,
        category,
        email,
        date,
        time,
    });

    return { success: true };
}
