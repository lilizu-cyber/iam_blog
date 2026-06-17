import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const siteBrand = 'cyberiam.blog'

export default function Disclaimer() {
  return (
    <>
      <Helmet>
        <title>Disclaimer - {siteBrand}</title>
        <meta
          name="description"
          content={`Disclaimer for ${siteBrand} — educational cybersecurity and IAM content.`}
        />
      </Helmet>

      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-white grid-hero-title-glow">
            Disclaimer
          </h1>
          <p className="mb-8 text-sm text-white/50">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-left text-white/80">
            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">Educational purpose</h2>
              <p>
                {siteBrand} publishes educational content about cybersecurity and identity &amp; access
                management (IAM). Articles, guides, and opinions on this site are provided for general
                information only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">Not professional advice</h2>
              <p>
                Nothing on this website constitutes legal, financial, medical, or professional security
                consulting advice. Security requirements vary by organization, jurisdiction, and risk
                profile. Always validate recommendations with your own policies, compliance obligations,
                and qualified professionals before implementation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">Accuracy and updates</h2>
              <p>
                We strive for accuracy, but technology and threats change quickly. Content may become
                outdated. We do not guarantee that information is complete, current, or error-free.
                Use at your own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">External links</h2>
              <p>
                This site may link to third-party websites. We are not responsible for their content,
                privacy practices, or availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">Advertising</h2>
              <p>
                We may display advertisements through Google AdSense. Ad content is served by third
                parties and does not necessarily reflect the views of {siteBrand}. See our{' '}
                <Link to="/privacy" className="text-[#00FBFF] hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookies" className="text-[#00FBFF] hover:underline">
                  Cookie Policy
                </Link>{' '}
                for details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00FBFF]">Contact</h2>
              <p>
                Questions about this disclaimer?{' '}
                <Link to="/contact" className="text-[#00FBFF] hover:underline">
                  Contact us
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
