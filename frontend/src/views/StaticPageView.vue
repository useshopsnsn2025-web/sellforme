<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pages = {
  'about-us': {
    title: 'About Us',
    useImages: true,
    content: `
    <p>Welcome to <strong>SellForMe</strong> — your trusted global marketplace for certified pre-owned electronics. Founded with a mission to make premium technology accessible and affordable for everyone, we connect individual sellers with buyers around the world through a transparent, secure consignment model.</p>

    <div class="about-hero-img"><img src="/src/static/images/about-us/1.png" alt="Our Team" /></div>

    <h3>Our Story</h3>
    <p>We started SellForMe because we believed the secondary electronics market was broken — overpriced, untrustworthy, and wasteful. Too many perfectly functional devices were being discarded simply because people didn't have a reliable way to sell or buy them. We set out to change that.</p>
    <p>Today, we serve thousands of customers across 50+ countries, offering a curated selection of pre-owned smartphones, tablets, laptops, and accessories — each carefully inspected and honestly described before it reaches your door.</p>

    <h3>How We Work</h3>
    <div class="about-img"><img src="/src/static/images/about-us/2.png" alt="Global Network" /></div>
    <p>We operate on a consignment model: sellers send us their devices, our team inspects and grades each item, and we handle everything from professional photography to secure payment processing and global shipping. Sellers get paid when their item sells. Buyers get a thoroughly vetted product backed by our full protection guarantee.</p>

    <h3>Our Commitment to Quality</h3>
    <div class="about-img"><img src="/src/static/images/about-us/3.png" alt="Quality Assurance" /></div>
    <ul>
      <li><strong>Honest Condition Grading:</strong> Every item is graded by our trained inspection team using a standardized condition scale — no surprises when the package arrives.</li>
      <li><strong>Functionality Tested:</strong> All devices undergo a multi-point functional test covering display, battery, cameras, buttons, ports, and connectivity.</li>
      <li><strong>Authentic Products Only:</strong> We do not accept counterfeit, stolen, or blacklisted devices. Serial numbers are verified before listing.</li>
      <li><strong>Real Photos:</strong> Every listing uses actual photos of the item — not stock images.</li>
    </ul>

    <h3>Why Choose SellForMe?</h3>
    <div class="about-img"><img src="/src/static/images/about-us/4.png" alt="Customer Support" /></div>
    <ul>
      <li>✓ Free worldwide shipping on every order</li>
      <li>✓ Full buyer protection on all purchases</li>
      <li>✓ Secure checkout powered by industry-leading payment processors</li>
      <li>✓ Dedicated customer support team available Monday–Friday</li>
      <li>✓ Hassle-free returns within the return window</li>
      <li>✓ Eco-friendly — every purchase extends a device's life and reduces e-waste</li>
    </ul>

    <h3>Our Values</h3>
    <p><strong>Transparency.</strong> We show you exactly what you're getting — condition, photos, functionality status, and any known cosmetic imperfections — before you buy.</p>
    <p><strong>Trust.</strong> We stand behind every transaction. If something isn't right, we make it right. That's our promise.</p>
    <p><strong>Sustainability.</strong> Choosing pre-owned electronics is one of the most impactful environmental decisions a consumer can make. We're proud to be part of that movement.</p>

    <h3>Our Fulfillment Center</h3>
    <div class="about-img"><img src="/src/static/images/about-us/5.png" alt="Fulfillment Center" /></div>
    <p>Our state-of-the-art fulfillment center ensures every order is carefully packaged and shipped with precision. From inspection to dispatch, we maintain the highest standards so your purchase arrives safely and on time.</p>

    <h3>Get in Touch</h3>
    <p>Have questions or need assistance? Our team is here to help. Email us at <strong>sellformeus@gmail.com</strong> and we'll get back to you within 24 hours, Monday through Friday.</p>`,
  },

  'shipping-policy': {
    title: 'Shipping Policy',
    content: `
    <p>At SellForMe, we are committed to delivering your order safely, reliably, and as quickly as possible. Below you'll find everything you need to know about our shipping process.</p>

    <h3>Free Worldwide Shipping</h3>
    <p>We offer <strong>complimentary standard shipping on every order</strong>, regardless of order value or destination. No minimum purchase required, no hidden fees at checkout.</p>

    <h3>Shipping Methods & Estimated Delivery Times</h3>
    <ul>
      <li><strong>Standard Shipping (Free):</strong> 7–15 business days depending on destination</li>
      <li><strong>Expedited Shipping:</strong> 3–7 business days (additional fee applies at checkout)</li>
      <li><strong>Express Shipping:</strong> 2–3 business days (available for select destinations)</li>
    </ul>
    <p>Delivery times are estimates and may vary due to customs processing, carrier delays, or peak periods such as holidays. Business days exclude weekends and public holidays.</p>

    <h3>Order Processing Time</h3>
    <p>Orders are typically processed and dispatched within <strong>1–3 business days</strong> of payment confirmation. You will receive a shipment confirmation email with tracking information as soon as your order leaves our facility.</p>

    <h3>Order Tracking</h3>
    <p>Every order is assigned a tracking number. Once shipped, you can track your package in real time through the carrier's website or via the tracking link provided in your shipment confirmation email. You can also view your order status at any time by logging into your account and visiting <strong>My Orders</strong>.</p>

    <h3>International Shipping & Customs</h3>
    <p>We ship to 50+ countries worldwide. International orders may be subject to customs duties, import taxes, or fees levied by your country's customs authority. These charges, if applicable, are the responsibility of the recipient and are not included in our shipping fees.</p>
    <p>We recommend checking your local customs regulations before placing an order. We are unable to mark orders as "gifts" or under-declare values on customs documents.</p>

    <h3>Packaging</h3>
    <p>All items are carefully packaged to withstand international transit. Electronics are wrapped in protective materials and placed in sturdy outer packaging. We take great care to ensure your item arrives in the same condition it left our hands.</p>

    <h3>Lost or Delayed Shipments</h3>
    <p>If your order has not arrived within the estimated delivery window, please contact our support team at <strong>sellformeus@gmail.com</strong>. We will work with the carrier to locate your shipment. If a package is confirmed lost in transit, we will provide a full refund or replacement at no additional cost to you.</p>`,
  },

  'returns-refunds': {
    title: 'Returns & Refunds',
    content: `
    <p>We want you to be completely satisfied with your purchase. If for any reason you are not happy with your order, our returns and refunds policy is designed to make the process as simple and fair as possible.</p>

    <h3>Return Eligibility</h3>
    <p>You may request a return within <strong>30 days</strong> of the confirmed delivery date, provided the following conditions are met:</p>
    <ul>
      <li>The item is in the same condition as when it was received</li>
      <li>All original accessories and components included with the order are returned</li>
      <li>The item has not been physically damaged, modified, or tampered with after receipt</li>
      <li>The return request is submitted within the 30-day window</li>
    </ul>

    <h3>Non-Returnable Items</h3>
    <p>The following items are not eligible for return:</p>
    <ul>
      <li>Items that have been damaged after delivery due to misuse or accidents</li>
      <li>Items with removed or altered serial numbers</li>
      <li>Items explicitly marked as "Final Sale" or "Non-Returnable" in the product listing</li>
    </ul>

    <h3>How to Initiate a Return</h3>
    <ol>
      <li><strong>Contact Us:</strong> Email our support team at sellformeus@gmail.com with your order number and reason for return.</li>
      <li><strong>Receive Authorization:</strong> We will review your request and issue a Return Merchandise Authorization (RMA) number within 1–2 business days.</li>
      <li><strong>Ship the Item:</strong> Pack the item securely and ship it to the address provided. Please include your RMA number on the outside of the package.</li>
      <li><strong>Inspection:</strong> Once we receive the returned item, our team will inspect it within 2–3 business days.</li>
      <li><strong>Refund Issued:</strong> Upon successful inspection, your refund will be processed.</li>
    </ol>

    <h3>Refund Processing</h3>
    <p>Refunds are issued to the <strong>original payment method</strong> used at checkout. Please allow:</p>
    <ul>
      <li><strong>Credit / Debit Card:</strong> 5–10 business days after refund is processed</li>
      <li><strong>PayPal:</strong> 3–5 business days</li>
      <li><strong>Other Payment Methods:</strong> Up to 10 business days</li>
    </ul>
    <p>You will receive an email confirmation once your refund has been initiated. Processing times may vary depending on your financial institution.</p>

    <h3>Return Shipping Costs</h3>
    <p>If the return is due to our error (wrong item shipped, item not as described, item arrived damaged), we will cover the return shipping cost in full. For all other return reasons, the buyer is responsible for return shipping charges.</p>

    <h3>Exchanges</h3>
    <p>We do not offer direct exchanges. If you'd like a different item, please initiate a return and place a new order for the desired product.</p>

    <h3>Questions?</h3>
    <p>If you have any questions about our return process, don't hesitate to contact us at <strong>sellformeus@gmail.com</strong>. We're here to help.</p>`,
  },

  'buyer-confidence': {
    title: 'Buyer Confidence',
    content: `
    <p>At SellForMe, your confidence and peace of mind are our top priorities. We've built every part of our buying experience around one goal: making sure you can shop with complete trust.</p>

    <h3>Our Buyer Confidence Guarantee</h3>
    <p>Every purchase made on SellForMe is backed by our comprehensive Buyer Confidence Guarantee. This means:</p>
    <ul>
      <li><strong>What You See Is What You Get:</strong> Every listing features real photos of the actual item and an honest, detailed condition description. If the item doesn't match the listing, we'll make it right — no questions asked.</li>
      <li><strong>Secure Payments:</strong> All transactions are processed through PCI-DSS compliant payment gateways. Your payment information is never stored on our servers.</li>
      <li><strong>Full Buyer Protection:</strong> Every order is covered by our Buyer Protection Policy. If your item doesn't arrive or isn't as described, you're entitled to a full refund.</li>
      <li><strong>Verified Items Only:</strong> Each device is inspected and verified by our team before listing. Counterfeit, stolen, or blacklisted devices are never accepted.</li>
    </ul>

    <h3>Our Inspection Process</h3>
    <p>Before any item is listed for sale, it goes through a rigorous multi-step inspection:</p>
    <ul>
      <li>Physical cosmetic assessment — screen, body, ports, and buttons</li>
      <li>Full functional test — display, battery health, cameras, audio, connectivity (Wi-Fi, Bluetooth, cellular)</li>
      <li>Serial number and IMEI verification to confirm the device is not reported lost or stolen</li>
      <li>Software reset to factory settings to protect both seller and buyer data</li>
    </ul>

    <h3>Transparent Condition Grading</h3>
    <p>We use a clear, standardized grading system so you always know exactly what you're getting:</p>
    <ul>
      <li><strong>Like New:</strong> Pristine condition with no visible signs of use. May include original packaging.</li>
      <li><strong>Excellent:</strong> Minor cosmetic marks only visible under close inspection. Fully functional.</li>
      <li><strong>Good:</strong> Light wear consistent with regular use. No impact on functionality.</li>
      <li><strong>Fair:</strong> Noticeable cosmetic wear but fully functional. Clearly noted in the listing.</li>
    </ul>

    <h3>Dedicated Customer Support</h3>
    <p>Our support team is available Monday through Friday to assist with any questions, concerns, or issues. We respond to all inquiries within 24 hours. Your satisfaction doesn't end at checkout — we're here for the entire ownership experience.</p>

    <h3>Trusted by Thousands</h3>
    <p>We've helped thousands of buyers across 50+ countries find the electronics they need at prices that make sense. Our repeat customer rate is a testament to the trust we've built — and we're committed to earning yours too.</p>`,
  },

  'buyer-protection': {
    title: 'Buyer Protection Policy',
    content: `
    <p>Every order placed on SellForMe is protected by our comprehensive Buyer Protection Policy. We are committed to ensuring that every transaction is safe, fair, and transparent.</p>

    <h3>What Is Buyer Protection?</h3>
    <p>Buyer Protection is our guarantee that covers you from the moment you place an order to the moment you're satisfied with your purchase. If something goes wrong, we will work to resolve the issue — up to and including a full refund.</p>

    <h3>What's Covered</h3>
    <ul>
      <li><strong>Item Not Received:</strong> If your order does not arrive within the estimated delivery window and cannot be located by the carrier, you are entitled to a full refund or replacement.</li>
      <li><strong>Item Significantly Not as Described:</strong> If the item you receive is materially different from the listing description or photos — including undisclosed defects, wrong model, or misrepresented condition — you qualify for a full refund.</li>
      <li><strong>Damaged in Transit:</strong> If your item arrives damaged due to shipping mishandling, we will cover the cost of repair or replacement.</li>
      <li><strong>Counterfeit or Inauthentic Item:</strong> We only sell genuine products. In the extremely unlikely event that an inauthentic item reaches you, you will receive an immediate full refund.</li>
    </ul>

    <h3>How to File a Claim</h3>
    <ol>
      <li><strong>Document the Issue:</strong> Take clear photos of the item and, if applicable, the packaging upon arrival.</li>
      <li><strong>Contact Us Within 30 Days:</strong> Email sellformeus@gmail.com with your order number, a description of the issue, and any supporting photos.</li>
      <li><strong>We Review Your Claim:</strong> Our team will review your claim within 1–2 business days and may request additional information.</li>
      <li><strong>Resolution:</strong> Once approved, we will arrange a return (if applicable) and process your refund within 5–7 business days, or dispatch a replacement.</li>
    </ol>

    <h3>Secure Payment Processing</h3>
    <p>All payments on SellForMe are processed through trusted, PCI-DSS compliant payment processors. We use SSL encryption across our entire platform. We never store your full card details on our servers. Your financial information is always protected.</p>

    <h3>Our Commitment</h3>
    <p>We stand behind every transaction on our platform. Our Buyer Protection Policy reflects our belief that commerce should be built on trust. When you shop with us, you are never alone — we are here to back you up every step of the way.</p>`,
  },

  'warranty-policy': {
    title: 'Warranty Policy',
    content: `
    <p>All items sold on SellForMe have been thoroughly inspected and tested before listing. We stand behind the quality and functionality of every product we sell, and our warranty policy reflects that commitment.</p>

    <h3>Standard Warranty Coverage</h3>
    <p>Every item sold on our platform comes with a <strong>30-day functionality warranty</strong> from the date of delivery. This warranty covers:</p>
    <ul>
      <li>Hardware failures not caused by physical damage after receipt</li>
      <li>Any functional defect that was not disclosed in the product listing</li>
      <li>Battery that does not hold a charge as described</li>
      <li>Screen, camera, audio, or connectivity issues not present at the time of listing</li>
    </ul>

    <h3>What Is Not Covered</h3>
    <ul>
      <li>Physical damage caused after delivery (drops, water damage, cracks)</li>
      <li>Damage resulting from unauthorized repair or modification</li>
      <li>Normal cosmetic wear described in the listing</li>
      <li>Software issues caused by user-installed applications</li>
      <li>Issues arising from use with incompatible accessories</li>
    </ul>

    <h3>Extended Warranty</h3>
    <p>For select high-value items, extended warranty options of 90 days or 6 months may be available. Extended warranty coverage, if applicable, will be clearly noted in the product listing. Extended warranties cover the same functional defects as the standard warranty for the specified period.</p>

    <h3>How to Make a Warranty Claim</h3>
    <ol>
      <li>Contact our support team at <strong>sellformeus@gmail.com</strong> within the warranty period.</li>
      <li>Provide your order number and a clear description of the issue, including photos or video if possible.</li>
      <li>Our team will assess the claim and respond within 1–2 business days.</li>
      <li>If the claim is approved, we will arrange return shipping and either repair, replace, or refund the item at our discretion.</li>
    </ol>

    <h3>Manufacturer's Warranty</h3>
    <p>Some items may still be within the original manufacturer's warranty period. If applicable, this will be noted in the product listing. We do not guarantee that manufacturer warranties are transferable, and recommend checking with the manufacturer directly for details.</p>

    <h3>Our Inspection Guarantee</h3>
    <p>Before every item is listed, it undergoes a comprehensive multi-point functionality test by our trained inspection team. We are confident in the quality of every item we sell, and our warranty is our promise to back that confidence.</p>`,
  },

  'consignment-policy': {
    title: 'Consignment Policy — How It Works',
    content: `
    <p>SellForMe operates on a consignment model, which means we sell items on behalf of individual sellers. This approach allows us to offer a wide, unique selection of pre-owned electronics while giving sellers a safe, professional, and hassle-free way to turn their unused devices into cash.</p>

    <h3>For Buyers — What Consignment Means for You</h3>
    <p>When you purchase from SellForMe, you are buying a real item from a real person — but with all the safety, protection, and reliability of a professional marketplace. Here's what that means for you:</p>
    <ul>
      <li><strong>Independently Inspected:</strong> Every item submitted by a seller is independently inspected by our team before it's listed. We verify condition, functionality, and authenticity — so you don't have to take anyone's word for it.</li>
      <li><strong>Honest, Detailed Listings:</strong> We create the listing ourselves — including real photos and an accurate condition description — based on our inspection results. No seller self-reporting.</li>
      <li><strong>Full Buyer Protection:</strong> Regardless of where the item came from, you're covered by our complete Buyer Protection Policy on every purchase.</li>
      <li><strong>Unique, One-of-a-Kind Items:</strong> Because items come from individual sellers, many listings are one-of-a-kind. Once sold, the same item will not be available again. We recommend purchasing when you find what you're looking for.</li>
    </ul>

    <h3>For Sellers — How to Sell with Us</h3>
    <p>Selling with SellForMe is designed to be simple, transparent, and rewarding. Here's how the process works:</p>
    <ol>
      <li><strong>Submit Your Device:</strong> Contact us to begin the consignment process. Tell us what you'd like to sell and its general condition.</li>
      <li><strong>Ship to Us:</strong> We'll provide you with shipping instructions. Send your device to our inspection facility — shipping is typically arranged and covered by us.</li>
      <li><strong>Inspection & Listing:</strong> Our team will inspect your device, determine its condition grade, photograph it professionally, and create a detailed listing at a fair market price.</li>
      <li><strong>We Handle Everything:</strong> From the moment we receive your device, we take care of storage, listing management, buyer communication, payment processing, and shipping. You don't need to do a thing.</li>
      <li><strong>Get Paid:</strong> When your item sells, we process the payment and transfer your share to you within 3–5 business days. Our commission is deducted from the sale price — you keep the rest.</li>
    </ol>

    <h3>Seller Commission & Pricing</h3>
    <p>SellForMe charges a competitive commission on each successful sale. We work with you to set a fair listing price that reflects the device's condition and current market value. You will always know exactly what you stand to earn before we list your item.</p>

    <h3>Item Acceptance</h3>
    <p>We accept a wide range of pre-owned electronics including smartphones, tablets, laptops, smartwatches, and accessories. We reserve the right to decline items that are:</p>
    <ul>
      <li>Non-functional beyond repair</li>
      <li>Reported as lost or stolen</li>
      <li>Counterfeit or non-genuine</li>
      <li>Missing key components that make them unsellable</li>
    </ul>
    <p>If we are unable to sell your item, we will contact you to arrange its return.</p>

    <h3>Contact Us to Get Started</h3>
    <p>Interested in selling with us? Email us at <strong>sellformeus@gmail.com</strong> with details about your device and we'll be in touch within 24 hours.</p>`,
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    content: `
    <p><em>Last updated: March 2026</em></p>
    <p>At SellForMe ("we," "our," or "us"), we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it. Please read this policy carefully.</p>

    <h3>1. Information We Collect</h3>
    <p>We collect information you provide directly to us, as well as information generated through your use of our platform:</p>
    <ul>
      <li><strong>Account Information:</strong> Name, email address, password (encrypted), and profile details provided at registration.</li>
      <li><strong>Order & Transaction Data:</strong> Billing address, shipping address, order history, and payment confirmation details (we do not store full card numbers).</li>
      <li><strong>Communication Data:</strong> Emails, support tickets, and messages you send to our team.</li>
      <li><strong>Usage Data:</strong> Pages visited, time spent on site, device type, browser type, IP address, and referring URLs — collected via cookies and similar technologies.</li>
      <li><strong>Device Information:</strong> When you purchase a device from or sell a device to us, we may record the device's IMEI or serial number for verification purposes.</li>
    </ul>

    <h3>2. How We Use Your Information</h3>
    <ul>
      <li>To process and fulfill your orders and communicate order status</li>
      <li>To verify your identity and prevent fraud</li>
      <li>To provide customer support and respond to your inquiries</li>
      <li>To send transactional emails (order confirmations, shipping updates)</li>
      <li>To send marketing communications, if you have opted in (you can opt out at any time)</li>
      <li>To improve our website, product listings, and customer experience</li>
      <li>To comply with legal obligations</li>
    </ul>

    <h3>3. How We Share Your Information</h3>
    <p>We do not sell your personal information to third parties. We may share your data with:</p>
    <ul>
      <li><strong>Shipping carriers</strong> (name and delivery address only) to fulfill your order</li>
      <li><strong>Payment processors</strong> to securely handle transactions</li>
      <li><strong>Service providers</strong> who assist in operating our platform (e.g., email services, analytics) under strict data processing agreements</li>
      <li><strong>Law enforcement or regulatory authorities</strong> if required by applicable law</li>
    </ul>

    <h3>4. Cookies & Tracking Technologies</h3>
    <p>We use cookies and similar tracking technologies to improve your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect the functionality of our website.</p>

    <h3>5. Data Security</h3>
    <p>We implement industry-standard security measures to protect your personal data, including:</p>
    <ul>
      <li>SSL/TLS encryption for all data transmitted through our platform</li>
      <li>Encrypted storage of sensitive data</li>
      <li>Access controls limiting who within our organization can access personal information</li>
      <li>Regular security reviews and updates</li>
    </ul>
    <p>While we take every reasonable precaution, no method of data transmission or storage is 100% secure. We encourage you to use a strong, unique password for your account.</p>

    <h3>6. Data Retention</h3>
    <p>We retain your personal information for as long as your account is active or as needed to provide you services. If you close your account, we will delete or anonymize your data within a reasonable period, unless we are required to retain it by law (e.g., transaction records for tax or legal compliance).</p>

    <h3>7. Your Rights</h3>
    <p>Depending on your location, you may have the following rights regarding your personal data:</p>
    <ul>
      <li>The right to access the personal information we hold about you</li>
      <li>The right to correct inaccurate information</li>
      <li>The right to request deletion of your data</li>
      <li>The right to opt out of marketing communications at any time</li>
      <li>The right to data portability (where applicable under law)</li>
    </ul>
    <p>To exercise any of these rights, please contact us at <strong>sellformeus@gmail.com</strong>.</p>

    <h3>8. Children's Privacy</h3>
    <p>Our platform is not directed at children under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal information, please contact us and we will take steps to delete it.</p>

    <h3>9. Changes to This Policy</h3>
    <p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Your continued use of our platform after any changes constitutes your acceptance of the updated policy.</p>

    <h3>10. Contact Us</h3>
    <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at <strong>sellformeus@gmail.com</strong>. We are committed to resolving any privacy concerns promptly and transparently.</p>`,
  },

  'terms-of-service': {
    title: 'Terms of Service',
    content: `
    <p><em>Last updated: March 2026</em></p>
    <p>Please read these Terms of Service ("Terms") carefully before using the SellForMe platform (the "Platform"), operated by SellForMe ("we," "us," or "our"). By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree, please do not use our Platform.</p>

    <h3>1. Eligibility</h3>
    <p>You must be at least 18 years of age to create an account and use our Platform. By using our Platform, you represent and warrant that you meet this eligibility requirement. We reserve the right to terminate accounts found to be in violation of this requirement.</p>

    <h3>2. Account Registration & Security</h3>
    <p>To access certain features of our Platform, you must register for an account. You agree to:</p>
    <ul>
      <li>Provide accurate, current, and complete information during registration</li>
      <li>Maintain and promptly update your account information</li>
      <li>Keep your password confidential and not share it with any third party</li>
      <li>Notify us immediately at sellformeus@gmail.com if you suspect unauthorized access to your account</li>
      <li>Accept responsibility for all activities that occur under your account</li>
    </ul>

    <h3>3. Purchasing & Payments</h3>
    <ul>
      <li>All prices displayed are in USD unless otherwise specified. Currency conversions are for reference only and may vary.</li>
      <li>By placing an order, you authorize us to charge the stated amount to your chosen payment method.</li>
      <li>We reserve the right to cancel any order at our discretion, including due to pricing errors, suspected fraud, or stock unavailability. You will receive a full refund in such cases.</li>
      <li>All sales are subject to our Returns & Refunds Policy.</li>
      <li>Payment information is processed by third-party payment processors and is subject to their terms and privacy policies.</li>
    </ul>

    <h3>4. Product Listings & Condition</h3>
    <p>All items are pre-owned and listed with honest condition descriptions. We make every reasonable effort to accurately describe each item. However, minor discrepancies in color, cosmetic details, or accessories not specified in the listing shall not constitute grounds for a dispute unless they materially affect the item's functionality or value.</p>

    <h3>5. Shipping & Delivery</h3>
    <p>We will make all reasonable efforts to ship your order within the stated processing time. We are not liable for delays caused by shipping carriers, customs authorities, or events beyond our reasonable control (force majeure). Risk of loss and title for purchased items pass to you upon delivery to the shipping carrier.</p>

    <h3>6. Returns & Refunds</h3>
    <p>Returns and refunds are governed by our Returns & Refunds Policy, which is incorporated into these Terms by reference. By placing an order, you agree to the terms of that policy.</p>

    <h3>7. Prohibited Conduct</h3>
    <p>You agree not to use our Platform to:</p>
    <ul>
      <li>Violate any applicable laws or regulations</li>
      <li>Engage in fraudulent, deceptive, or misleading activity</li>
      <li>Submit false, misleading, or defamatory reviews or content</li>
      <li>Attempt to gain unauthorized access to any part of our Platform or systems</li>
      <li>Interfere with the proper functioning of the Platform</li>
      <li>Harass, abuse, or harm other users or our staff</li>
      <li>Use automated tools (bots, scrapers) to access or extract content from the Platform without our express written permission</li>
    </ul>

    <h3>8. Intellectual Property</h3>
    <p>All content on the Platform — including text, images, logos, product listings, and software — is owned by or licensed to SellForMe and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>

    <h3>9. Limitation of Liability</h3>
    <p>To the fullest extent permitted by applicable law, SellForMe shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use our Platform, even if we have been advised of the possibility of such damages. Our total liability to you for any claim arising out of or related to these Terms or your use of the Platform shall not exceed the amount you paid for the order giving rise to the claim.</p>

    <h3>10. Disclaimer of Warranties</h3>
    <p>The Platform is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, beyond those explicitly stated in our product listings and policies. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.</p>

    <h3>11. Governing Law</h3>
    <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising out of or relating to these Terms or your use of the Platform shall be resolved through good-faith negotiation where possible, or through binding arbitration if negotiation fails.</p>

    <h3>12. Changes to These Terms</h3>
    <p>We reserve the right to modify these Terms at any time. We will notify users of material changes by updating the "Last updated" date and, where appropriate, by sending an email notification. Your continued use of the Platform after any changes constitutes your acceptance of the revised Terms.</p>

    <h3>13. Contact</h3>
    <p>If you have any questions about these Terms of Service, please contact us at <strong>sellformeus@gmail.com</strong>. We are happy to clarify any aspect of our policies.</p>`,
  },

  'contact-us': {
    title: 'Contact Us',
    content: `
    <p>We're here to help. Whether you have a question about an order, need assistance with a return, or simply want to know more about how SellForMe works, our support team is ready to assist you.</p>

    <h3>Email Support</h3>
    <p>The best way to reach us is by email. Send your inquiry to:</p>
    <p><strong>📧 sellformeus@gmail.com</strong></p>
    <p>Please include your <strong>order number</strong> (if applicable) and a clear description of your question or issue so we can assist you as efficiently as possible.</p>

    <h3>Support Hours</h3>
    <p><strong>Monday – Friday:</strong> 8:00 AM – 8:30 PM (Eastern Standard Time)</p>
    <p>We are closed on weekends and public holidays. Inquiries received outside of business hours will be responded to on the next business day.</p>

    <h3>Response Time</h3>
    <p>We aim to respond to all inquiries within <strong>24 hours</strong> on business days. During peak periods (such as holidays or sales events), response times may be slightly longer. We appreciate your patience.</p>

    <h3>What to Include in Your Message</h3>
    <p>To help us resolve your inquiry as quickly as possible, please provide:</p>
    <ul>
      <li>Your full name and the email address associated with your account</li>
      <li>Your order number (found in your confirmation email or under My Orders)</li>
      <li>A clear description of your question or issue</li>
      <li>Any relevant photos (e.g., if reporting a damaged or incorrect item)</li>
    </ul>

    <h3>Common Inquiries</h3>
    <p>Before reaching out, you may find answers to common questions in our policy pages:</p>
    <ul>
      <li><a href="/pages/shipping-policy">Shipping Policy</a> — delivery times, tracking, international shipping</li>
      <li><a href="/pages/returns-refunds">Returns & Refunds</a> — how to return an item and get a refund</li>
      <li><a href="/pages/buyer-protection">Buyer Protection</a> — what's covered and how to file a claim</li>
      <li><a href="/pages/warranty-policy">Warranty Policy</a> — coverage details and how to make a claim</li>
    </ul>

    <h3>Selling with Us</h3>
    <p>Interested in selling your pre-owned electronics through our consignment program? We'd love to hear from you. Email us with details about the device(s) you'd like to sell and we'll walk you through the process.</p>

    <p>Thank you for choosing SellForMe. We look forward to hearing from you.</p>`,
  },
}

const page = computed(() => pages[route.params.slug] || { title: 'Page Not Found', content: '<p>The page you are looking for does not exist.</p>' })
</script>

<template>
  <div class="static-page">
    <div class="container">
      <div class="breadcrumb">
        <router-link to="/">Home</router-link>
        <span>/</span>
        <span class="current">{{ page.title }}</span>
      </div>
      <article class="page-content">
        <h1>{{ page.title }}</h1>
        <div v-html="page.content"></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.static-page { padding: 20px 0 80px; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); color: var(--color-text-lighter); margin-bottom: 32px; }
.breadcrumb a:hover { color: var(--color-primary); }
.breadcrumb .current { color: var(--color-text); }
.page-content { max-width: 800px; }
.page-content h1 { font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: 32px; }
.page-content :deep(h3) { font-size: var(--font-size-lg); font-weight: 600; margin: 28px 0 12px; color: var(--color-text); }
.page-content :deep(p) { font-size: var(--font-size-base); color: var(--color-text-light); line-height: 1.8; margin-bottom: 16px; }
.page-content :deep(ul) { margin: 12px 0 20px 20px; }
.page-content :deep(li) { font-size: var(--font-size-base); color: var(--color-text-light); line-height: 1.8; list-style: disc; margin-bottom: 6px; }
.page-content :deep(strong) { color: var(--color-text); }
.page-content :deep(a) { color: var(--color-primary); text-decoration: underline; }
.page-content :deep(a:hover) { opacity: 0.8; }
.page-content :deep(ol) { margin: 12px 0 20px 20px; }
.page-content :deep(ol li) { font-size: var(--font-size-base); color: var(--color-text-light); line-height: 1.8; list-style: decimal; margin-bottom: 8px; }
.page-content :deep(.about-hero-img) { margin: 24px 0 32px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.page-content :deep(.about-hero-img img) { width: 100%; height: auto; display: block; }
.page-content :deep(.about-img) { margin: 20px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.page-content :deep(.about-img img) { width: 100%; height: auto; display: block; }
</style>
