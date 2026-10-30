import Image from "next/image";

export default function Faq() {
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
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Frequently Asked Questions</h2>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">
                        <h4>For Testers & Samplers</h4>
                        <p>
                            <strong>What is Revtail?</strong>
                            <br />
                            Revtail is a product testing and consumer feedback platform where eligible consumers discover products,
                            purchase and use them, share genuine feedback, and get rewarded.
                            <br /><br />
                            <strong>How does Revtail work?</strong>
                            <br />
                            Buy → Use → Give Feedback → Get Full Reimbursement → Earn Cash Bonus. You purchase the
                            eligible product, use it, share genuine feedback, and after successfully completing campaign
                            requirements, receive the full eligible purchase amount back along with a cash bonus.
                            <br /><br />
                            <strong>Do I have to purchase the product myself?</strong>
                            <br />
                            Yes. Participants purchase the eligible product first. Once campaign requirements are successfully
                            completed and approved, the full eligible purchase amount is reimbursed.
                            <br /><br />
                            <strong>Will I get the full product amount reimbursed?</strong>
                            <br />
                            Yes. The full eligible purchase amount of the campaign product is reimbursed after successfully
                            completing all campaign requirements.
                            <br /><br />
                            <strong>Will I always receive a cash bonus?</strong>
                            <br />
                            Yes. Every Revtail campaign includes a cash bonus. The bonus amount may vary from campaign to
                            campaign depending on factors such as the product and its purchase price. The applicable bonus is
                            displayed in campaign details.
                            <br /><br />
                            <strong>When will I receive reimbursement and cash bonus?</strong>
                            <br />
                            After purchase, feedback, and required information are reviewed and approved, reimbursement and cash
                            bonus are processed according to the campaign payout timeline.
                            <br /><br />
                            <strong>What kind of feedback do I need to provide?</strong>
                            <br />
                            Genuine feedback based on your actual product experience. It can be positive, negative, or mixed.
                            <br /><br />
                            <strong>Can my feedback be rejected?</strong>
                            <br />
                            Yes, if it is incomplete, copied, irrelevant, fraudulent, late, or does not meet campaign requirements.
                            <br /><br />
                            <strong>Can I participate in multiple campaigns?</strong>
                            <br />
                            Yes, if you meet eligibility requirements and the relevant campaigns are available to you.
                            <br /><br />
                            <strong>Can I create multiple accounts?</strong>
                            <br />
                            No. Each participant may maintain only one account.
                            <br /><br />
                            <strong>What happens if I don't complete a campaign?</strong>
                            <br />
                            You may become ineligible for reimbursement and the cash bonus if required activities are not completed
                            within the stated timeline.
                            <br /><br />
                            <strong>How do I receive reimbursement and reward?</strong>
                            <br />
                            Through the payment method specified by Revtail for the relevant campaign.
                        </p>
                        <h4>For Brands</h4>
                        <p>
                            <strong>How can my brand work with Revtail?</strong>
                            <br />
                            Brands can partner with Revtail for product-testing and consumer feedback campaigns. Our team can help
                            structure campaigns around product, audience, and objectives.
                            <br /><br />
                            <strong>What can brands use Revtail for?</strong>
                            <br />
                            Product testing, consumer feedback, product discovery, sampling campaigns, consumer insights, and
                            understanding real-world product experiences.
                            <br /><br />
                            <strong>Can we target specific consumers?</strong>
                            <br />
                            Yes. Campaigns can be designed around relevant criteria such as location, demographics, interests,
                            product categories, and other audience requirements, subject to platform capabilities.
                            <br /><br />
                            <strong>Will brands receive consumer feedback?</strong>
                            <br />
                            Yes. Brands receive relevant feedback and insights collected through their campaigns.
                            <br /><br />
                            <strong>How does Revtail ensure genuine feedback?</strong>
                            <br />
                            Participants are encouraged to share their actual experiences and are not required to provide a
                            predetermined positive or negative opinion.
                            <br /><br />
                            <strong>How do we start a campaign?</strong>
                            <br />
                            Contact the Revtail team with your product, campaign objectives, target audience, and requirements.
                            <br /><br />
                            <strong>Is there a minimum campaign size?</strong>
                            <br />
                            Campaign requirements may vary depending on product, audience, and objectives.
                            <br /><br />
                            <strong>How much does a campaign cost?</strong>
                            <br />
                            Pricing depends on factors such as product, campaign size, target audience, and requirements. Contact
                            Revtail for a customized proposal.
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
