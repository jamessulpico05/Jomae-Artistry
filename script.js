
const header = document.getElementById("header");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const filterButtons = document.querySelectorAll(".filter-btn");
const portfolioItems = document.querySelectorAll(".portfolio-item");
const bookingForm = document.getElementById("bookingForm");
const formStatus = document.getElementById("formStatus");

// Update header when scrolling
function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 40);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// Mobile navigation
menuBtn.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuBtn.setAttribute("aria-expanded", String(isOpen));
  menuBtn.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
  menuBtn.textContent = isOpen ? "✕" : "☰";
});

// Close menu after choosing a navigation link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open navigation");
    menuBtn.textContent = "☰";
  });
});

// Portfolio category filters
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter;

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    portfolioItems.forEach((item) => {
      const matches =
        selectedCategory === "all" ||
        item.dataset.category === selectedCategory;

      item.classList.toggle("hidden", !matches);
    });
  });
});

// Display the current year in the footer
document.getElementById("year").textContent =
  new Date().getFullYear();


/* Supabase connection */

const SUPABASE_URL = "https://ujeoxgfvaijgsboahduu.supabase.co";
const SUPABASE_KEY = "sb_publishable_JSDlFlmBwzFjDOROENdfow_DWX6q9f7";


const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* Save booking inquiries and send email notifications */
bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!bookingForm.reportValidity()) return;

  const submitButton = bookingForm.querySelector(
    'button[type="submit"]'
  );

  const formData = new FormData(bookingForm);

  const inquiry = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    event_date: formData.get("date") || null,
    message: String(formData.get("message") || "").trim()
  };

  submitButton.disabled = true;
  formStatus.textContent = "Sending your inquiry...";

  try {
    // First, save the booking inquiry to the database.
    const { error: insertError } = await supabaseClient
      .from("booking_inquiries")
      .insert([inquiry]);

    if (insertError) throw insertError;

    // Then, request an email notification.
    const { error: emailError } = await supabaseClient.functions.invoke(
      "send-booking-notification",
      {
        body: inquiry
      }
    );

    if (emailError) {
      console.error("Email notification failed:", emailError);

      formStatus.textContent =
        "Your inquiry was saved, but the email notification failed. Please contact us if needed.";
    } else {
      formStatus.textContent =
        "Thank you! Your inquiry was sent successfully.";
    }

    bookingForm.reset();

  } catch (error) {
    console.error("Booking submission failed:", error);

    formStatus.textContent =
      "Sorry, your inquiry could not be saved. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

