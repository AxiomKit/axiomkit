import { SOCIAL_LINK } from "@/lib/constants";
import { BookOpen, Github, MessageCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import Logo from "@/public/logo.png";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-12 mb-8">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Image
                  src={Logo.src}
                  alt="Axiomkit-logo-footer"
                  className="h-5 w-5"
                  height={20}
                  width={20}
                />
              </div>
              <span className="text-xl font-bold text-red-500">AxiomKit</span>
            </div>
            <p className="text-slate-400 text-sm">
              Production-ready framework for building intelligent, autonomous
              agents with advanced cognitive capabilities.
            </p>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href="/docs/framework"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Documentation
                </Link>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Examples
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Playground
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Roadmap
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Community</h4>
              <div className="space-y-2 text-sm">
                <Link
                  target="_blank"
                  href={SOCIAL_LINK.github}
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  GitHub
                </Link>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Discord
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Showcase
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Contact
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Enterprise
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-slate-200 transition-colors block"
                >
                  Status
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-500 text-sm">
            &copy; 2025 AxiomKit. Built for the future of AI development.
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a
              href={SOCIAL_LINK.github}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
