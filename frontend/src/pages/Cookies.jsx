import { Helmet } from 'react-helmet-async'

export default function Cookies() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - CyberSec & IAM Blog</title>
        <meta name="description" content="Cookie Policy for CyberSec & IAM Blog" />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Cookie Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-dark max-w-none text-left">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                What Are Cookies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cookies are small text files that are placed on your computer or mobile device when 
                you visit a website. They are widely used to make websites work more efficiently and 
                provide information to the owners of the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                How We Use Cookies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly
                </li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website
                </li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Preference Cookies:</strong> These cookies remember your preferences, such as theme settings
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Types of Cookies We Use
              </h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Session Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These are temporary cookies that are deleted when you close your browser. They help 
                  maintain your session while you navigate through the website.
                </p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Persistent Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These cookies remain on your device for a set period or until you delete them. They 
                  remember your preferences and settings for future visits.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Managing Cookies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control and manage cookies in various ways. Please keep in mind that removing 
                or blocking cookies can impact your user experience and parts of our website may no 
                longer be fully accessible.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Most browsers allow you to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">See what cookies you have and delete them individually</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Block third-party cookies</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Block cookies from particular sites</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Block all cookies</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Delete all cookies when you close your browser</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Third-Party Cookies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report 
                usage statistics of the website and refine marketing efforts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Updates to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Cookie Policy from time to time. We will notify you of any changes 
                by posting the new Cookie Policy on this page and updating the "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}





