import Image from "next/image";

export default function CommunityGuidelines() {
return (
<>
<section className="page-title-button-style ipad-top-space-margin big-section cover-background overflow-hidden"> 
        <div className="container position-relative">
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
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Be Genuine. Be Fair. Be Respectful.</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Community Guidelines</h2>
                    <p className="mt-2">Revtail is built around real product experiences and genuine consumer feedback.</p>
                </div>
            </div>  
        </div>
    
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">
                        <p>
                            <strong>1. Give Genuine Feedback</strong>
                            <br />
                            Share your honest experience. Your feedback may be positive, negative, or mixed, as long as it reflects your real experience.
                            <br /><br />
                            <strong>2. Don't Submit Fake Information</strong>
                            <br />
                            Do not submit fake reviews, receipts, altered documents, false purchase information, fabricated product
                            experiences, or another person's information.
                            <br /><br />
                            <strong>3. One Person, One Account</strong>
                            <br />
                            Do not create multiple accounts or allow another person to use your account.
                            <br /><br />
                            <strong>4. Follow Campaign Instructions</strong>
                            <br />
                            Read campaign requirements carefully and complete required activities within the stated timeline.
                            <br /><br />
                            <strong>5. Respect Other Users</strong>
                            <br />
                            Do not post or send abusive, threatening, discriminatory, harassing, or otherwise inappropriate content.
                            <br /><br />
                            <strong>6. Protect Personal Information</strong>
                            <br />
                            Do not share another person's private or sensitive information without appropriate permission.
                            <br /><br />
                            <strong>7. Don't Manipulate Feedback</strong>
                            <br />
                            Do not coordinate with others to artificially influence ratings, feedback, campaign results, or consumer
                            sentiment.
                            <br /><br />
                            <strong>8. No Reward Manipulation</strong>
                            <br />
                            Do not use duplicate purchases, multiple accounts, fake transactions, fraudulent documents, false
                            submissions, or deceptive methods to obtain rewards.
                            <br /><br />
                            <strong>9. Respect Intellectual Property</strong>
                            <br />
                            Do not upload or share content that infringes copyright, trademark, privacy, or other legal rights.
                            <br /><br />
                            <strong>10. Consequences</strong>
                            <br />
                            Violations may result in rejection of submissions, withholding of rewards, restricted campaign access,
                            suspension, or permanent termination.
                            <br /><br />
                            <strong>11. Our Goal</strong>
                            <br />
                            Consumers get genuine opportunities. Brands get genuine insights. Feedback remains authentic
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
