import Image from "next/image";

export default function PrivacyPage() {
return (
<>
<section className="page-title-button-style  ipad-top-space-margin big-section pb-0 md-pt-0 cover-background overflow-hidden"> 
        <div className="container position-relative h-100">
            <div className="position-absolute top-30px left-50px xs-left-10px d-none d-sm-block animation-rotation">
                
                <Image 
                src="/assets/images/demo-data-analysis-bg-011.webp" 
                alt="" 
                width={100}
                height={0}
                sizes="100vw"
                style={{ width: '100px', height: 'auto' }} 
                data-bottom-top="transform: rotate(-50deg) translateY(-50px)" 
                data-top-bottom="transform:rotate(10deg) translateY(50px)" 
                suppressHydrationWarning={true}
                />
            </div> 
            <div className="position-absolute bottom-150px right-50px xs-right-10px d-none d-sm-block animation-rotation">
                <Image 
                    src="/assets/images/demo-data-analysis-bg-011.webp" 
                    alt="" 
                    width={80}
                    height={0}
                    sizes="100vw"
                    style={{ width: '80px', height: 'auto' }}
                    data-bottom-top="transform: rotate(-50deg) translateY(-50px)" 
                    data-top-bottom="transform:rotate(10deg) translateY(50px)" 
                    suppressHydrationWarning={true}
                />
            </div> 
            <div className="row align-items-center justify-content-center extra-small-screen mt-5">
                <div className="col-xl-5 col-lg-6 col-md-7 col-sm-9 position-relative text-center page-title-extra-small" data-anime='{ "el": "childs", "translateY": [30, 0], "opacity": [0,1], "duration": 600, "delay": 0, "staggervalue": 300, "easing": "easeOutQuad" }'>
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Last Updated : 04-10-2026</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Privacy Policy</h2>
                    <p className="mt-2">Revtail (“we”, “us”, or “our”) respects your privacy and is committed to protecting the personal information you share with us.</p>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            <strong>1. Information We Collect</strong>
                            <br />
                            <strong>Account Information:</strong> name, mobile number, email, age/date of birth, gender where needed, city/state, login details.
                            <br />
                            <strong>Profile & Campaign Information:</strong> preferences, interests, campaign history, product-testing history,
                            feedback, photographs or other campaign content where required.
                            <br />
                            <strong>Verification Information:</strong> information or documents needed for identity/profile verification, subject to
                            applicable law and the relevant process.
                            <br />
                            <strong>Purchase & Reimbursement Information:</strong> order details, invoice/receipt, product details, payment or reimbursement information.
                            <br />
                            <strong>Technical Information: </strong> IP address, device/browser information, operating system, usage information,
                            device identifiers, logs, approximate location, cookies and similar technologies.
                            <br /><br />
                            <strong>2. How We Use Information</strong>
                            <br />
                            We use information to manage accounts, determine campaign eligibility, match users to campaigns,
                            operate campaigns, verify purchases, process reimbursements/rewards, collect feedback, provide
                            support, prevent fraud, improve services, and comply with legal requirements.
                            <br /><br />
                            <strong>3. Consumer Feedback</strong>
                            <br />
                            Campaign feedback may be shared with the relevant brand for understanding consumer experiences and
                            improving products or services. Where appropriate, feedback may be aggregated or anonymized.
                            <br /><br />
                            <strong>4. Information Shared With Brands</strong>
                            <br />
                            Relevant campaign participation information, feedback, product-related information, and other information
                            necessary to operate the campaign may be shared with the relevant brand. We do not intend to sell
                            personal information to brands simply for their independent marketing purposes.
                            <br /><br />
                            <strong>5. Service Providers</strong>
                            <br />
                            We may use trusted providers for hosting, analytics, communications, support, payment processing,
                            verification, security, fraud prevention, and infrastructure.
                            <br /><br />
                            <strong>6. Marketing Communications</strong>
                            <br />
                            With appropriate permissions where required, we may send campaign, reward, promotional, and service
                            communications. You may opt out of promotional communications where applicable.
                            <br /><br />
                            <strong>7. Cookies</strong>
                            <br />
                            We may use cookies and similar technologies for login, preferences, analytics, security, and performance.
                            <br /><br />
                            <strong>8. Data Security</strong>
                            <br />
                            We take reasonable technical and organizational measures to protect personal information, but no
                            internet-based service can guarantee complete security.
                            <br /><br />
                            <strong>9. Data Retention</strong>
                            <br />
                            We retain information as reasonably necessary for services, campaign records, payments, disputes, fraud
                            prevention, and legal, accounting, tax, or regulatory requirements.
                            <br /><br />
                            <strong>10. Your Privacy Rights</strong>
                            <br />
                            Depending on applicable law, you may have rights to access, correct, delete, withdraw consent, request
                            processing information, and raise privacy grievances.
                            <br /><br />
                            <strong>11. Children's Privacy</strong>
                            <br />
                            Revtail is not intended for individuals who are not legally eligible to participate. We do not knowingly collect
                            children's information in violation of applicable law.
                            <br /><br />
                            <strong>12. Third-Party Services</strong>
                            <br />
                            Third-party websites and services linked through Revtail have their own privacy practices. Review their
                            policies before providing information.
                            <br /><br />
                            <strong>13. International Transfers</strong>
                            <br />
                            Where service providers process information outside India, information may be transferred or processed
                            according to applicable laws and safeguards.
                            <br /><br />
                            <strong>14. Changes</strong>
                            <br />
                            We may update this Privacy Policy and publish the revised version with an updated date.
                            <br /><br />
                            <strong>15. Contact & Privacy Grievances</strong>
                            <br />
                            For privacy questions, requests, or complaints, contact Revtail through the official contact details provided
                            on the Platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
<div className="scroll-progress d-none d-xxl-block">
<a href="#" className="scroll-top" aria-label="scroll">
<span className="scroll-text">Scroll</span><span className="scroll-line"><span className="scroll-point"></span></span>
</a>
</div>
</>
);
}
