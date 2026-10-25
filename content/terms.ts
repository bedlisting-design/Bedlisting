import {
  OWNER_SHARE,
  EARNING_HOLD_DAYS,
  MIN_PAYOUT_NAIRA,
  UNLOCK_COST,
  SIGNUP_BONUS_CREDITS,
  BOOST_OPTIONS,
  ROOMMATE_CONNECT_COST,
  ROOMMATE_REQUEST_EXPIRES_HOURS,
} from "@/lib/pricing";

/**
 * Format: blocks separated by a blank line.
 *   "## Title"       a numbered section heading (numbers are added automatically)
 *   lines with "- "  a bullet list
 *   anything else    a paragraph
 * The numbers (40%, 7 days, prices) come from lib/pricing.ts, so this text
 * always matches what the app really does.
 */
const share = Math.round(OWNER_SHARE * 100);
const boosts = BOOST_OPTIONS.map((b) => `${b.days} days for ${b.cost} bedcoins`).join(", ");

export const TERMS_TEXT = `
## About bedlisting

bedlisting is a digital property and housing platform that helps people looking for a home connect with landlords and property owners.

The Platform may enable users to:

- Search for available properties and accommodation;
- List properties for rent or for sale;
- Connect people looking for a property with landlords, owners or authorized representatives;
- Communicate about property opportunities;
- Create and manage property-related profiles; and
- Use additional property services introduced by bedlisting from time to time.

Unless expressly stated otherwise, bedlisting acts as a technology platform and intermediary. It is not a landlord, property owner, real-estate agent, broker, property manager, buyer, seller, or party to any transaction between users.

## Acceptance of these Terms

By accessing, registering for, or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform. By using the Platform you confirm that:

- You have read and understood these Terms;
- You are legally capable of entering into a binding agreement;
- The information you provide to bedlisting is accurate and not misleading; and
- Your use of the Platform complies with applicable laws and regulations.

If you use the Platform on behalf of a company, agency or other entity, you confirm that you have authority to bind that entity to these Terms.

## Eligibility

You may use bedlisting only if you are legally permitted to do so under applicable law. Some services may require additional identity verification, age, ownership, authorization or documentation. bedlisting may restrict, suspend or end access for any user who does not meet the requirements.

## User accounts

Some features require an account. You agree to:

- Provide accurate and current information;
- Keep your account information up to date;
- Keep your login details confidential;
- Tell us promptly about suspected unauthorized access; and
- Confirm your email address using the link we send you, which you need to do before you can unlock listings, message other users, buy bedcoins, list properties or withdraw earnings; and
- Accept responsibility for activity on your account where the law allows.

You must not create an account with false information, impersonate another person or organization, allow others to use your account, create multiple accounts for deceptive or abusive purposes, or try to access another user’s account. bedlisting may suspend or end accounts it reasonably believes have been used fraudulently, unlawfully, abusively or in breach of these Terms.

There are two kinds of user account: people looking for a property, and landlords. Landlords list properties. People looking for a property browse, unlock and contact listers.

## Profiles of people looking for a property

Depending on the features available, a landlord may see:

- The user’s first name and the initial of their surname;
- Verification status;
- Optional housing preferences, budget range or move date; and
- Other information the user chooses to submit to find suitable accommodation.

Personal contact details such as a private phone number are not shown automatically. They are shared only if you choose to share them through a Platform feature. bedlisting may change profile features and visibility settings as the Platform develops.

## Privacy and personal information

Your use of the Platform is also subject to the bedlisting Privacy Policy. bedlisting will collect, use, store and disclose personal information only as permitted by applicable law and as reasonably necessary to provide, improve, secure and administer the Platform.

Users are responsible for taking care before voluntarily sharing personal information with another user. You must not use information obtained through the Platform to:

- Harass another person;
- Send unsolicited or abusive communications;
- Commit fraud or identity theft;
- Discriminate unlawfully;
- Publish another person’s private information without authorization; or
- Engage in any unlawful activity.

## Property listings

Users who list a property are responsible for making sure the listing is accurate, lawful and not misleading. A lister confirms that:

- They own the property or are legally authorized to advertise it;
- The property is genuinely available for the stated purpose;
- The description, photos, videos, price and location are accurate;
- The lodge type and amenities they state (for example running water, a water heater, an overhead tank or constant light) are true at the time of listing and are kept up to date;
- Material information has not been intentionally concealed;
- The listing does not infringe another person’s rights; and
- The listing complies with applicable laws and regulations.

Amenities and similar details are statements made by the lister. bedlisting does not check them. bedlisting may remove, reject, edit, suspend or investigate any listing that appears fraudulent, misleading, unlawful, duplicated, expired or against Platform standards. Some changes to a live listing, such as the title, photos, videos, price, location or ownership document, may send it back for review.

## Landlords, owners and representatives

A person who advertises a property as a landlord, owner, property manager or authorized representative must state their relationship to the property accurately. You must not falsely claim to own or represent a property.

Listings marked "Official bedlisting" are posted by bedlisting itself. The same accuracy standards apply, and bedlisting is the lister for those listings. bedlisting may request documents to verify identity, ownership, authority or relationship to a property. Verification does not guarantee that a property, person, document or transaction is free from risk. Users should carry out their own checks.

## User communications

The Platform lets users message each other. Users must communicate respectfully and lawfully. The following is prohibited:

- Harassment or threats;
- Hate speech or unlawful discrimination;
- Fraudulent or deceptive messages;
- Requests for unnecessary sensitive personal information;
- Impersonation, spam or sexual harassment;
- Attempts to obtain money through deception; and
- Any communication that breaks the law.

bedlisting may review, restrict or remove communications where reasonably necessary for security, fraud prevention, abuse prevention, legal compliance or Platform administration, as the law allows.

## What verification means

bedlisting may offer different kinds of verification. At the time of these Terms:

- A verified landlord badge means bedlisting has reviewed an identity document submitted by that person.
- A "Verified property" badge means a bedlisting administrator reviewed an ownership document submitted for that listing.

Verification does not guarantee a user’s future conduct, the condition of a property, the truth of every statement made by a user (including amenities), that a property will remain available, that a transaction will be completed, or that a user or property is free from risk. Use your own judgment and caution.

## Property inspections and due diligence

You are strongly encouraged to inspect a property and carry out due diligence before making a payment, signing an agreement or entering a property transaction. Where relevant, check for yourself:

- That the property exists and its condition;
- Ownership, or the authority to rent, lease, sell or represent it;
- The terms of any proposed agreement;
- Required government or regulatory approvals;
- Fees, charges and obligations; and
- Any other material information.

bedlisting does not guarantee that a listing or user is suitable for your needs.

## Payments and financial transactions

Payments made on the Platform, such as buying bedcoins, are processed by our payment partner, Paystack, and are also subject to Paystack’s own terms. bedlisting does not store your card details.

Rent, deposits, purchase prices and similar amounts are paid between users, outside bedlisting, unless bedlisting expressly states that an approved payment process exists. bedlisting does not hold rent, deposits or purchase money. Be careful when paying anyone, and do not pay for a property you have not inspected.

## Property sales

Landlords and owners may list properties for sale. For sales listings, bedlisting only helps a buyer connect with the seller. bedlisting is not a party to the sale and does not provide legal advice, escrow, valuation, title checks or transfer of ownership. Buyers and sellers should use their own lawyers and surveyors. bedlisting may publish additional terms for services connected with property sales in the future.

## Fees and paid services

Browsing is free. Some features need bedcoins or payment, including:

- Unlocking a listing (see the sections below); and
- Featuring a listing for greater visibility (currently ${boosts}).

The price or number of bedcoins is shown before you confirm. Unless these Terms or the law say otherwise, fees for completed services are not refundable.

## Bedcoins

bedcoins are non-transferable digital credits used to access paid features inside bedlisting. bedcoins are not cryptocurrency, electronic money, a deposit, an investment or a financial asset. They cannot be traded, sent to another user or exchanged for cash, and they earn no interest.

You can buy bedcoins through the payment options shown on the Platform. The price of each bedcoin pack and the number of bedcoins needed for each feature are shown before you confirm, and bedlisting may change them for future purchases and spending.

New accounts of people looking for a property may receive ${SIGNUP_BONUS_CREDITS} free bedcoins. Free bedcoins have no cash value and are used before purchased bedcoins.

Purchased bedcoins do not currently expire. If bedlisting introduces an expiry, it will give reasonable advance notice before it applies to bedcoins you already hold.

## Unlocking a listing

You can browse, search and see one photo of the inside of a property, together with its price, area, lodge type, amenities and description, without paying. To see the other photos (including photos of the outside of the building), any video tour, the exact address, the map pin and directions, the lister’s name and details, and to message the lister, you unlock the listing by spending the number of bedcoins shown (currently ${UNLOCK_COST.RENT} bedcoins for a rental and ${UNLOCK_COST.SALE} for a sale). You pay once for each listing.

Unlocking gives you access to information and the ability to message the lister. It does not promise that the property is available, that its details are accurate, or that you will be able to rent or buy it.


## Earnings and withdrawals for landlords

When a user spends purchased bedcoins to unlock your listing, you earn ${share}% of the money that user actually paid for those bedcoins. bedlisting keeps the remaining ${100 - share}%. Free bedcoins do not generate earnings.

- Earnings are held for ${EARNING_HOLD_DAYS} days and then become available to withdraw.
- To withdraw you must have a verified identity, at least ₦${MIN_PAYOUT_NAIRA.toLocaleString()} available, and a bank account in your verified name.
- Withdrawals are reviewed and paid by bedlisting by bank transfer. bedlisting may delay or refuse a withdrawal where it suspects fraud or a breach of these Terms.
- If a listing is removed for being fraudulent, misleading or against these Terms, earnings from it that have not been paid out are cancelled, and users who unlocked it are refunded.
- bedlisting may withhold or recover earnings obtained through fraud, unlocking your own listings, fake accounts or other manipulation.
- Earnings are not wages. You are responsible for any tax that applies to your earnings.
- Bedcoins you spend to feature your own listing are not earnings and are not refundable, except for a technical error.

## Refunds

bedcoins that have been spent are generally not refundable, except that:

- If bedlisting removes a listing as fraudulent or misleading, the bedcoins spent to unlock it are returned to your bedcoin balance.
- If a roommate request is declined, cancelled by you or not answered in time, the bedcoins are returned.
- If you are charged but your bedcoins are not added, or another technical error occurs, contact support and we will correct it.

Requests to refund unspent purchased bedcoins to your original payment method are considered case by case and as the law requires.

## Roommate matching

Users who are 18 or over can create a roommate profile and ask other users to connect. Your profile shows your first name and the initial of your surname, your gender, your area, your budget range, your move-in date and the lifestyle details you choose to enter. It does not show a photo or your contact details. You may choose to share only with people of the same gender.

Matches are a convenience, not a recommendation. bedlisting does not check what people say about themselves in roommate profiles and is not responsible for any arrangement between users. Meet in a public place, check the property and agree the terms in writing before you pay anyone anything.

Sending a roommate request costs ${ROOMMATE_CONNECT_COST} bedcoins. They are returned if the request is declined, if you cancel it, or if it is not answered within ${ROOMMATE_REQUEST_EXPIRES_HOURS} hours. They are not returned once the other person accepts. Chat opens only after a request is accepted.

You must not use roommate matching to harass or discriminate against anyone, to ask for money, or to collect personal information. bedlisting may remove profiles and end connections that break these Terms.

## Prohibited activities

You must not use bedlisting to:

- Commit or help others commit fraud;
- Advertise a property you have no authority to advertise;
- Collect money for a property that does not exist;
- Post false, misleading or deceptive listings or amenities;
- Manipulate availability or pricing deceptively;
- Unlock or message your own listings, or use fake accounts, to create earnings or bedcoin activity;
- Harass, threaten or abuse another user;
- Get around Platform security measures;
- Introduce viruses, malware or harmful code;
- Scrape, copy or commercially exploit Platform data without permission;
- Create fake accounts or fake verification information;
- Infringe intellectual property rights;
- Use the Platform for unlawful discrimination;
- Sell or transfer accounts without permission; or
- Engage in any other unlawful or abusive conduct.

## User content

You may submit content such as property descriptions, photographs, profile information and messages. You keep ownership of content you lawfully own. By submitting content, you give bedlisting a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display, adapt, format and distribute it as reasonably needed to run, promote and improve the Platform. You confirm that you have the right to submit it. bedlisting may remove content that breaks these Terms, the law, intellectual property rights or Platform policies.

## Intellectual property

The bedlisting name, branding, software, design, graphics, logos, text, features and databases belong to or are licensed to bedlisting and are protected by law. You may not copy, reproduce, distribute, modify, reverse engineer or commercially exploit them without written permission, except where the law allows.

## Third-party services

The Platform may link to or use third-party services, including payment providers, mapping services, identity and document services, and analytics providers. bedlisting is not responsible for third-party services outside its reasonable control. Their own terms and policies apply to your use of them. Directions links open Google Maps, which is governed by Google’s terms.

## No guarantee of transactions

bedlisting provides technology to help users discover, communicate and possibly transact. Unless agreed otherwise in writing, bedlisting does not guarantee that a person will find a property, that a lister will find a tenant or buyer, that a listing will get enquiries or stay available, that a transaction will be completed, the financial reliability of any user, or the conduct of any user. Transactions between users are their own responsibility.

## Disclaimer of warranties

To the maximum extent the law allows, the Platform is provided "as is" and "as available". bedlisting does not guarantee that the Platform will always be uninterrupted, error-free or secure. Nothing in these Terms removes rights that cannot lawfully be removed.

## Limitation of liability

To the maximum extent the law allows, bedlisting and its owners, officers, employees, contractors, partners and service providers are not liable for indirect, incidental, special, consequential or punitive losses arising from use of the Platform. Property transactions involve financial, legal and personal risk, and you must use reasonable care and your own judgment. Nothing in these Terms limits liability where that would be unlawful.

## Indemnity

To the extent the law allows, you agree to indemnify and hold harmless bedlisting and its representatives from claims, losses, liabilities, damages and expenses arising from your breach of these Terms, your unlawful use of the Platform, your listing or content, your violation of another person’s rights, or your fraudulent or misleading conduct.

## Suspension and termination

bedlisting may suspend, restrict or end access to the Platform where reasonably necessary to protect users, investigate suspected fraud, enforce these Terms, comply with legal obligations, protect the security of the Platform, or prevent abuse. Where appropriate and practicable, bedlisting may give notice. You may stop using the Platform at any time.

## Changes to the Platform

bedlisting may modify, improve, suspend, discontinue or introduce features at any time, including new payment systems, verification processes, premium services, mobile apps and other property-related products. bedlisting does not have to keep every feature forever.

## Changes to these Terms

bedlisting may update these Terms from time to time. Where a change is material, we may tell you through the Platform, by email or another reasonable method. Continuing to use the Platform after updated Terms take effect may count as accepting them, as the law allows.

## Governing law

These Terms are governed by the laws of the Federal Republic of Nigeria, unless mandatory law requires otherwise. Any dispute will be subject to the proper dispute-resolution process or the court with lawful jurisdiction.

## Disputes between users

bedlisting may, but is not generally obliged to, help resolve disputes between users. Users are encouraged to resolve disputes directly and lawfully. bedlisting is not automatically responsible for contractual disputes between landlords, tenants, buyers, sellers or other users. Where needed for safety, fraud prevention or legal compliance, bedlisting may investigate reports and act against accounts or content.

## Reporting fraud, abuse or unsafe activity

Please report suspected fraudulent listings, fake landlords, payment scams, harassment, impersonation, misleading property information (including wrong amenities) and other unsafe or unlawful conduct, using the Report button on a listing or by contacting us. bedlisting may investigate and take appropriate action. If there is an immediate threat to life, safety or property, contact the emergency services or law enforcement.

## Contact us

For questions, complaints, reports or concerns about these Terms or the Platform, contact bedlisting through the official contact details published on the Platform.

## Entire agreement

These Terms, together with the Privacy Policy and any additional service terms, payment terms and policies published by bedlisting, are the agreement between you and bedlisting about your use of the Platform. If any part of these Terms is found invalid or unenforceable, the rest continues to apply as far as the law allows.

By creating an account, accessing or using bedlisting, you acknowledge that you have read, understood and agreed to these Terms and Conditions.
`;
