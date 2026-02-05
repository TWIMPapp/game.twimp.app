# Valentine's Landing Page Spec

**URL:** `game.twimp.app/valentine`  
**Purpose:** Valentine's Day 2026 soft launch — two ways to send/create a valentine experience  
**Target audience:** Dads/partners looking for an inexpensive, unique Valentine's gift idea

---

## Design Notes

- **Branding:** Subtle TWIMP presence, not heavy-handed
- **Tone:** Warm, romantic, slightly playful — not cheesy
- **Mobile-first:** Most users will access via phone
- **Colors:** Valentine's palette (soft pinks, reds, white) but not garish

---

## Page Structure

### Hero Section

```
Simple, clean header with subtle Valentine's theming

Headline: "Surprise someone special this Valentine's Day"
Subhead: "Two ways to share a little love — no chocolates required"
```

---

### Option 1: Secret Valentine

**Card/Section styling:** Highlighted as the "quick & easy" option

```
💌 Secret Valentine

Send an anonymous valentine that magically appears near them.

Form fields:
├── Your email (required) — for accountability, not shared
├── Their email (required) — receives the invitation  
└── Your message (required, max 200 chars / ~30 words)
    Placeholder: "Write something sweet..."

[Send Secret Valentine] — Primary CTA button

Helper text below form:
"They'll receive an email inviting them to collect a mystery 
valentine near their location. Your identity stays secret 
unless you sign your message!"
```

**Character limit:** 200 characters (~30 words) — message will appear in a popup over a map on mobile

**Form validation:**
- Valid email formats for both fields
- Message between 1-200 characters
- Rate limit: Consider 3-5 per sender email per day (spam prevention)

**On submit:**
- Show success state: "💌 Sent! They'll receive their invitation shortly."
- Maybe confetti animation?

---

### Option 2: Romantic Trail

**Card/Section styling:** Secondary option, slightly less prominent

```
🗺️ Romantic Trail

Create a walk with love notes leading to a surprise.

Perfect for:
• A surprise lunch date
• Revisiting meaningful places
• A proposal route 💍
• "Our story" memory lane

Create waypoints with personal messages at each stop, 
then share the unique link with your valentine.

[Create Your Trail →] — Links to /custom-trail/create
```

---

### Footer

```
Minimal footer:

Made with ❤️ by TWIMP
[Privacy] [Terms]

Optional: "TWIMP creates outdoor adventures that bring stories to life. 
Coming Easter 2026: The Eggstraordinary Egg Hunt"
```

---

## Technical Notes

### Secret Valentine Flow
1. User submits form
2. Backend creates valentine record (sender email, recipient email, message)
3. Email sent to recipient with unique link
4. Recipient opens link → game spawns the valentine ~100m from their GPS location
5. They walk to collect it → message revealed in popup

### Romantic Trail Flow
1. User clicks "Create Your Trail"
2. Redirects to `/custom-trail/create` (existing functionality)
3. User builds trail, gets shareable link
4. They send link to their valentine directly (WhatsApp, text, etc.)

### API Endpoint Needed (Secret Valentine)
```
POST /api/valentine/send
{
  senderEmail: string,
  recipientEmail: string,
  message: string (max 200 chars)
}

Response: { success: true, valentineId: string }
```

---

## Email Template (Secret Valentine)

**Subject:** 💌 Someone sent you a Secret Valentine!

**Body:**
```
You have a Secret Valentine waiting for you!

Someone special wanted to surprise you with a 
little Valentine's magic.

[Collect Your Valentine] — Button/link to game

Your valentine will appear somewhere nearby. 
Take a short walk to find it and discover their message.

Happy Valentine's Day! 💕

—
TWIMP | Outdoor adventures that bring stories to life
```

---

## Copy Alternatives

**Headlines:**
- "Surprise someone special this Valentine's Day"
- "A Valentine's gift that gets them outside"
- "Love notes, delivered differently"
- "Skip the card aisle"

**Secret Valentine taglines:**
- "Send an anonymous valentine that magically appears near them"
- "A mystery message, delivered to their doorstep (almost)"
- "Like a love letter, but they have to find it"

**Trail taglines:**
- "Create a walk with love notes leading to a surprise"
- "Breadcrumbs of love leading somewhere special"
- "Turn your date into an adventure"

---

## Assets Needed

- [ ] Valentine-themed hero image or illustration (subtle, not clip-art)
- [ ] Icon for Secret Valentine (envelope with heart?)
- [ ] Icon for Romantic Trail (map pin with heart?)
- [ ] Success state illustration
- [ ] Email template header image

---

## Launch Plan

- **Page live by:** Feb 10 (gives 4 days before Valentine's)
- **Promote via:** @twimpapp X/Twitter, maybe a small ad spend test
- **Track:** Form submissions, email sends, valentine collections

---

*Spec created: 2026-02-05*  
*Author: Sadie*
