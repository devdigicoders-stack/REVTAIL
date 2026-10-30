import Image from "next/image";

export default function Terms() {
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
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Terms of Use</h2>
                    <p className="mt-2">Welcome to Revtail. These Terms of Use (“Terms”) govern your access to and use of the Revtail website,platform, applications, and related services (“Platform”).</p>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            <strong>1. About Revtail</strong>
                        <br />
                        Revtail is a product testing and consumer feedback platform that connects brands with eligible consumers
                        for product-testing campaigns. Participants may purchase, use, and provide genuine feedback about
                        products and receive full reimbursement and a cash bonus according to campaign terms.
                        <br /><br />
                        <strong>2. Eligibility</strong>
                        <br />
                        Provide accurate information, meet campaign eligibility requirements, use your own account, follow
                        campaign instructions and deadlines, and comply with applicable laws.
                        <br /><br />
                        <strong>3. Campaign Participation</strong>
                        <br />
                        Campaigns may specify product, purchase, eligibility, feedback, deadline, reimbursement, and reward
                        requirements. Participants must read campaign details before purchasing.
                        <br /><br />
                        <strong>4. Purchase & Reimbursement</strong>
                        <br />
                        Eligible purchases that satisfy campaign requirements qualify for full reimbursement of the eligible
                        purchase amount. Valid proof of purchase and successful completion of campaign activities may be
                        required.

                        <strong>5. Cash Rewards</strong>
                        <br />
                        Every Revtail campaign includes a cash bonus. The bonus amount varies by campaign and may depend
                        on the product and its purchase price. Rewards are subject to successful completion and approval.
                        <br /><br />
                        <strong>6. Feedback & Reviews</strong>
                        <br />
                        Participants must provide genuine feedback based on actual product experience. They must not submit
                        false, misleading, copied, manipulated, or fabricated feedback.
                        <br /><br />
                        <strong>7. Proof & Verification</strong>
                        <br />
                        Revtail may request proof of purchase, campaign participation, identity, or other campaign-related
                        information where necessary.
                        <br /><br />
                        <strong>8. Prohibited Activities</strong>
                        <br />
                        Do not create multiple accounts for fraudulent participation, use another person's identity, submit fake
                        documents, manipulate campaigns, or attempt to obtain reimbursement or rewards fraudulently.
                        <br /><br />
                        <strong>9. Account Suspension & Termination</strong>
                        <br />
                        Revtail may suspend or terminate accounts for violations, false information, fraud, abuse, repeated
                        non-compliance, or attempts to manipulate the Platform.
                        <br /><br />
                        <strong>10. Brand Campaigns</strong>
                        <br />
                        Campaign availability, eligibility, products, reimbursement, rewards, and requirements may vary. Revtail
                        does not guarantee selection for any particular campaign.
                        <br /><br />
                        <strong>11. Platform Availability</strong>
                        <br />
                        We aim to keep the Platform available but do not guarantee uninterrupted or error-free operation.
                        <br /><br />
                        <strong>12. Intellectual Property</strong>
                        <br />
                        Revtail content, branding, software, designs, and other materials are owned by or licensed to Revtail and
                        may not be used without authorization.
                        <br /><br />
                        <strong>13. Privacy</strong>
                        <br />
                        Your use of Revtail is also subject to our Privacy Policy.
                        <br /><br />
                        <strong>14. Changes</strong>
                        <br />
                        We may update these Terms from time to time. Continued use after publication of updates constitutes
                        acceptance.
                        <br /><br />
                        <strong>15. Limitation of Liability</strong>
                        <br />
                        To the extent permitted by applicable law, Revtail is not responsible for losses arising from circumstances
                        beyond reasonable control, including interruptions, technical failures, or third-party services.
                        <br /><br />
                        <strong>16. Governing Law</strong>
                        <br />
                        These Terms shall be governed by the laws of India, subject to applicable jurisdiction.
                        <br /><br />
                        <strong>17. Contact</strong>
                        <br />
                        For questions regarding these Terms or a campaign, contact Revtail through the official contact details on
                        the Platform.
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
