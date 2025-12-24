import { Helmet } from 'react-helmet-async'

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - CyberSec & IAM Blog</title>
        <meta name="description" content="Privacy Policy for CyberSec & IAM Blog" />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-dark max-w-none text-left">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This Privacy Policy describes how we collect, use, and protect your personal information 
                when you visit our blog and use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may collect the following types of information:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Contact information (name, email address) when you subscribe to our newsletter or contact us</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Usage data and analytics to improve our website</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Send you newsletters and updates</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Respond to your inquiries</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Improve our website and services</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Analyze website usage and trends</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Data Protection
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your personal information. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Access your personal data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Request correction of inaccurate data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Request deletion of your data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Unsubscribe from our newsletter at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about this Privacy Policy, please contact us through our contact form.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}












