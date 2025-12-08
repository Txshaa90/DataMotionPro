'use client'

import { Button } from '@/components/ui/button'
import { Database, Table, Zap, Lock, Users, Globe, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-green-800 bg-green-950/80 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">DataMotionPro</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-green-200 hover:text-white">Features</a>
            <Link href="/pricing" className="text-green-200 hover:text-white">Pricing</Link>
            <a href="#about" className="text-green-200 hover:text-white">About</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Create Account <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-8">
            <Zap className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">No-code database platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-200 to-emerald-400">
            Build Databases<br />Like Spreadsheets
          </h1>
          <p className="text-xl text-green-100 mb-12 max-w-2xl mx-auto">
            Create powerful databases, APIs, and workflows without writing code. 
            The simplicity of a spreadsheet with the power of a database.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Building Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-8 border-green-400 text-green-100 hover:bg-green-800">
                Sign In
              </Button>
            </Link>
          </div>
          
          {/* Hero Image/Preview */}
          <div className="mt-16 rounded-xl shadow-2xl border border-green-700 bg-green-900/50 p-4 max-w-5xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Database className="h-24 w-24 text-green-200 mx-auto mb-4" />
                <p className="text-xl font-medium text-green-100">Interactive Database Workspace</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-green-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Everything you need</h2>
            <p className="text-xl text-green-200">Powerful features for modern teams</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Table className="h-8 w-8" />}
              title="Spreadsheet Interface"
              description="Familiar spreadsheet-like interface that anyone can use. No learning curve."
            />
            <FeatureCard
              icon={<Database className="h-8 w-8" />}
              title="Real Database Power"
              description="Behind the scenes, it's a real database with relationships, validations, and more."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Instant APIs"
              description="Automatically generate REST APIs for your data. No backend coding required."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8" />}
              title="Secure by Default"
              description="Enterprise-grade security with role-based access control and encryption."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Real-time Collaboration"
              description="Work together with your team in real-time. See changes as they happen."
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Cloud Native"
              description="Access your data from anywhere. Automatic backups and scaling."
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-green-950">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Built for every team</h2>
            <p className="text-xl text-green-200">From startups to enterprises</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard
              title="Project Management"
              description="Track tasks, deadlines, and team progress all in one place."
              features={["Task tracking", "Timeline views", "Team collaboration"]}
            />
            <UseCaseCard
              title="CRM & Sales"
              description="Manage your customer relationships and sales pipeline effectively."
              features={["Contact management", "Deal tracking", "Sales analytics"]}
            />
            <UseCaseCard
              title="Inventory Management"
              description="Keep track of your products, stock levels, and suppliers."
              features={["Stock tracking", "Order management", "Supplier database"]}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-green-800">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">About DataMotionPro</h2>
            <p className="text-xl text-green-100">Building the future of data management</p>
          </div>
          
          <div className="space-y-8 text-green-50">
            <div className="bg-green-900/50 p-8 rounded-lg border border-green-700">
              <h3 className="text-2xl font-semibold mb-4 text-white">Our Mission</h3>
              <p className="text-lg leading-relaxed text-green-100">
                We believe that powerful data management tools shouldn't require a computer science degree. 
                DataMotionPro makes it easy for anyone to build, manage, and scale databases with the simplicity 
                of a spreadsheet and the power of a modern database.
              </p>
            </div>

            <div className="bg-green-900/50 p-8 rounded-lg border border-green-700">
              <h3 className="text-2xl font-semibold mb-4 text-white">Why DataMotionPro?</h3>
              <p className="text-lg leading-relaxed text-green-100 mb-4">
                Traditional databases are complex and require specialized knowledge. Spreadsheets are easy 
                but lack the power and scalability needed for modern applications. DataMotionPro bridges this gap.
              </p>
              <ul className="space-y-3 text-green-100">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-base">No-code interface that anyone can use</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-base">Real database power with relationships and validations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-base">Automatic API generation for your data</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-base">Enterprise-grade security and scalability</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-900/50 p-8 rounded-lg border border-green-700">
              <h3 className="text-2xl font-semibold mb-4 text-white">Built for Teams</h3>
              <p className="text-lg leading-relaxed text-green-100">
                Whether you're a startup building your first product, a growing business managing customer data, 
                or an enterprise team coordinating complex workflows, DataMotionPro scales with you. Real-time 
                collaboration, powerful permissions, and seamless integrations make it the perfect choice for 
                teams of any size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of teams building with DataMotionPro</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-950 text-green-300 py-12 px-4 border-t border-green-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-white">DataMotionPro</span>
              </div>
              <p className="text-sm">Build databases like spreadsheets</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2024 DataMotionPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-green-700 bg-green-800/50 hover:bg-green-800 hover:shadow-lg transition-all">
      <div className="text-green-300 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-green-100">{description}</p>
    </div>
  )
}

function UseCaseCard({ title, description, features }: { title: string; description: string; features: string[] }) {
  return (
    <div className="p-8 rounded-lg border border-green-700 bg-white dark:bg-green-800/50 shadow-lg">
      <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-700 dark:text-green-100 mb-6 text-base">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm text-gray-800 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
