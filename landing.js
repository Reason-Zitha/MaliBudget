import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const feedbackForm = document.getElementById("feedback-form");
const feedbackStatus = document.getElementById("feedback-status");
const submitButton = feedbackForm.querySelector('button[type="submit"]');

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("feedback-name").value.trim();
  const type = document.getElementById("feedback-type").value;
  const message = document.getElementById("feedback-message").value.trim();

  if (message.length < 5) {
    feedbackStatus.textContent = "Please enter a little more detail before sending.";
    feedbackStatus.className = "form-status error";
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = "Sending feedback…";

  try {
    await addDoc(collection(db, "feedback"), {
      name: name || "Anonymous",
      type,
      message,
      createdAt: serverTimestamp()
    });

    feedbackStatus.textContent = "Thank you. Your feedback has been sent.";
    feedbackStatus.className = "form-status success";
    feedbackForm.reset();
  } catch (error) {
    console.error("Feedback submission failed:", error);
    feedbackStatus.textContent = "We couldn't send your feedback. Please check your connection and try again.";
    feedbackStatus.className = "form-status error";
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send feedback <i data-lucide="send"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
});
