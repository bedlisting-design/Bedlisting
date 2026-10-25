import {
  OWNER_SHARE,
  EARNING_HOLD_DAYS,
  MIN_PAYOUT_NAIRA,
  UNLOCK_COST,
  ESCORT_COST,
  SIGNUP_BONUS_CREDITS,
  BOOST_OPTIONS,
  CREDIT_PACKAGES,
  ROOMMATE_CONNECT_COST,
  ROOMMATE_REQUEST_EXPIRES_HOURS,
} from "@/lib/pricing";

const share = Math.round(OWNER_SHARE * 100);
const boosts = BOOST_OPTIONS.map((b) => `${b.days} days for ${b.cost}`).join(", ");
const packs = CREDIT_PACKAGES.map((p) => `${p.credits} bedcoins for ₦${p.priceNaira.toLocaleString()}`).join(", ");

export type FaqGroup = { title: string; items: { q: string; a: string }[] };

export const FAQ: FaqGroup[] = [
  {
    title: "The basics",
    items: [
      { q: "What is bedlisting?", a: "bedlisting is a property platform that connects people looking for a home with landlords, property owners and agents. You can find homes to rent, and properties for sale." },
      { q: "Is bedlisting free to use?", a: "Yes, creating an account and browsing properties is free. A few features, such as unlocking a listing’s full details, need bedcoins." },
      { q: "Why do I need to confirm my email?", a: "It proves the address is yours, so we can send receipts and important updates and keep fake accounts out. You can browse straight away. You need to confirm before you unlock a listing, message someone, buy bedcoins, list a property or withdraw earnings. Look for our email (check spam) or use Resend in the banner at the top of the page." },
      { q: "What are bedcoins?", a: "bedcoins are credits used inside bedlisting to unlock paid features. They are not cryptocurrency, an investment or a financial asset, and they can’t be traded or sent to other people." },
      { q: "How do I buy bedcoins?", a: `On the Bedcoins page, using Paystack. Packs currently available: ${packs}.` },
      { q: "Do bedcoins expire?", a: "Not at the moment. If that ever changes, we will tell you in advance before it affects bedcoins you already hold." },
    ],
  },
  {
    title: "For people looking for a property",
    items: [
      { q: "Can I search without an account?", a: "Yes. You can browse and search listings without signing up. You need a free account to unlock a listing, message a lister or save properties." },
      { q: "What can I see for free?", a: "One photo of the inside of the home, the price, the area, the lodge type, the amenities and the description. To protect landlords and make sure people use bedlisting to connect, the outside of the building, the other photos, the exact address and the lister’s name stay hidden until you unlock." },
      { q: "What does unlocking give me?", a: "All the photos (including the outside of the building), any video tour, the exact address, the map pin and directions, the lister’s name and details, and the ability to message them. You pay once per listing." },
      { q: "How many bedcoins does unlocking cost?", a: `${UNLOCK_COST.RENT} bedcoins for a rental and ${UNLOCK_COST.SALE} for a property for sale. The cost is shown before you confirm. New accounts get ${SIGNUP_BONUS_CREDITS} free bedcoins.` },
      { q: "How do I contact a landlord or agent?", a: "Unlock the listing, then send a message from the property page. You can choose to share your phone number later." },
      { q: "Will my phone number be visible to everyone?", a: "No. Your contact details are not shown on your profile. You choose whether and when to share them." },
      { q: "What can a landlord or agent see about me?", a: "Only limited information: your first name and the initial of your surname, and optional details you add such as budget or move date." },
      { q: "Can I unlock more than one property?", a: "Yes. Each listing is unlocked separately." },
      { q: "What does “No map pin” mean?", a: "The lister hasn’t added a Google Maps location for that property. They may have added a Plus Code or written directions with landmarks instead. You can also ask the lister, or request an agent escort if the listing is by an agent." },
      { q: "What is an agent escort?", a: `On listings by agents, you can pay ${ESCORT_COST} bedcoins to have the agent meet you at the property. The bedcoins are held when you ask, returned if the agent declines or you cancel, and paid to the agent when you confirm the visit.` },
      { q: "Are the lodge type and amenities checked?", a: "The lodge type and amenities (running water, water heater, overhead tank, constant light) are stated by the lister, and bedlisting does not check them. Confirm them when you visit. If something is wrong, use Report on the listing." },
    ],
  },
  {
    title: "For landlords and agents",
    items: [
      { q: "Can I list my property on bedlisting?", a: "Yes. Create a landlord or agent account, submit your ID for verification, then add your listing. A bedlisting admin reviews it before it goes live." },
      { q: "Is it free to list?", a: "Yes. Paid options are only for getting more visibility." },
      { q: "How can I get more people to see my property?", a: `You can feature a listing so it shows first and carries a “Featured” tag. Currently ${boosts} bedcoins.` },
      { q: "Can I edit my listing?", a: "Yes, from your dashboard. Changing the title, photos, videos, price, place or ownership document sends the listing back for review. Smaller changes, such as amenities, go live straight away." },
      { q: "Can I add a video tour?", a: "Yes. You can add up to 2 videos (MP4, MOV or WebM, up to 80 MB each) when you add or edit a listing. Videos are shown only to people who unlock the listing. Adding or changing a video sends the listing back for review." },
      { q: "Can I remove my property once it’s rented?", a: "Yes. Remove it from your dashboard so people stop unlocking it." },
      { q: "What is different about an agent account?", a: "Agents can add an agency name and licence number to their profile, and can offer paid escorts to the properties they list." },
    ],
  },
  {
    title: "Verification and safety",
    items: [
      { q: "What does “Verified” mean?", a: "A verified landlord or agent has had an ID document reviewed by bedlisting. A “Verified property” tag means an admin reviewed an ownership document for that listing. These are specific checks, not a promise about the property or the person." },
      { q: "What does “Official bedlisting” mean?", a: "The listing was posted by the bedlisting team itself rather than by a landlord or agent. You unlock and message it in the same way, and you are talking to the bedlisting team." },
      { q: "Does verification guarantee that a person or property is safe?", a: "No. Verification is not a guarantee against fraud, disputes or property defects. Check things yourself before you pay or sign anything." },
      { q: "How do I report a suspicious listing or user?", a: "Use the Report button on the listing. We review reports and take action. If a listing is removed as fraudulent, people who unlocked it get their bedcoins back." },
      { q: "Should I send money before seeing a property?", a: "No. Inspect the property first, and confirm who owns it or has the right to rent or sell it, before you pay." },
    ],
  },
  {
    title: "Payments and refunds",
    items: [
      { q: "Are bedcoins refundable?", a: "Spent bedcoins generally aren’t. Exceptions: a listing removed as fraudulent or misleading (your unlock is returned), an escort that is declined or cancelled before acceptance, and technical errors. Unspent purchased bedcoins are considered case by case." },
      { q: "What if I paid but my bedcoins didn’t appear?", a: "Open the Bedcoins page and refresh. If they’re still missing, contact support with your payment details and we will fix it." },
      { q: "Can prices change?", a: "Yes, for future purchases. You are always shown the price before you pay." },
      { q: "Does bedlisting handle rent payments or deposits?", a: "No. Rent, deposits and purchase prices are paid between you and the lister, outside bedlisting. We don’t hold that money." },
    ],
  },
  {
    title: "Earnings and withdrawals (landlords and agents)",
    items: [
      { q: "Do landlords and agents earn money on bedlisting?", a: `Yes. When someone spends purchased bedcoins to unlock your listing, you earn ${share}% of what they paid for those bedcoins. bedlisting keeps ${100 - share}%.` },
      { q: "Do free bedcoins earn me anything?", a: "No. Only purchased bedcoins generate earnings." },
      { q: "When and how do I get paid?", a: `Earnings are held for ${EARNING_HOLD_DAYS} days. After that, verified landlords and agents can request a withdrawal of at least ₦${MIN_PAYOUT_NAIRA.toLocaleString()} to a bank account in their verified name. We review and pay by bank transfer.` },
      { q: "What happens to my earnings if a listing is removed?", a: "If a listing is removed as fraudulent or misleading, earnings from it that haven’t been paid out are cancelled and the people who unlocked it are refunded." },
    ],
  },
  {
    title: "Roommates",
    items: [
      { q: "What is roommate matching?", a: "You tell us your area, budget, move-in date and how you live, and we show you people who fit, best matches first. You can be looking for a place, or have a place to share." },
      { q: "Is it free?", a: `Creating a profile and seeing matches is free. Sending a request costs ${ROOMMATE_CONNECT_COST} bedcoins, returned if the person declines, you cancel, or they do not reply within ${ROOMMATE_REQUEST_EXPIRES_HOURS} hours.` },
      { q: "How are matches worked out?", a: "By area, budget overlap, move-in date, sleep habits, tidiness and attitude to visitors. Two things are never overridden: if you chose to share only with your own gender, you only see and are seen by that gender, and smokers are only matched with people who are fine with smoking." },
      { q: "Who can see my roommate profile?", a: "Other signed-in users with their own roommate profile who match you. They see your first name and last initial, your gender, area, budget, move-in date and lifestyle answers. Never a photo, phone number or email." },
      { q: "How do we talk?", a: "You send a request. If the other person accepts, a private chat opens. Please keep your exact address and documents out of the chat." },
      { q: "Is it safe?", a: "bedlisting does not check what people say about themselves in roommate profiles. Meet in a public place first, tell a friend, check the property, and never send money to someone you have not met. You can report anyone from their card or chat." },
      { q: "How do I remove my profile?", a: "Open Roommates, then Edit my profile. You can pause it (hidden from everyone) or delete it." },
    ],
  },
  {
    title: "What’s next",
    items: [
      { q: "Can I buy or sell a property on bedlisting?", a: "You can list a property for sale and connect with sellers or their agents. bedlisting does not handle the sale itself: no escrow, legal work or transfer of ownership, so use your own lawyer." },
      { q: "Will bedlisting offer moving or home services?", a: "Possibly. We may connect users with movers, cleaners, electricians, plumbers and similar professionals in the future." },
    ],
  },
];
