import { Video, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">iGOT Live</span>
            </div>
            <p className="text-sm text-accent-foreground/80">
              An initiative under Mission Karmayogi to enable live streaming and event management for government capacity building.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                  About iGOT Karmayogi
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Mission Karmayogi</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Capacity Building Commission</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">DOPT</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">User Manual</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-primary transition-colors">FAQs</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Technical Support</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Training Materials</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Best Practices</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-base">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Department of Personnel & Training, Government of India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@igotkarmayogi.gov.in" className="hover:text-primary transition-colors">
                  support@igotkarmayogi.gov.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>1800-123-4567 (Toll Free)</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6 bg-accent-foreground/20" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-accent-foreground/40">|</span>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="text-accent-foreground/40">|</span>
            <a href="#" className="hover:text-primary transition-colors">Accessibility</a>
            <span className="text-accent-foreground/40">|</span>
            <a href="#" className="hover:text-primary transition-colors">Copyright Policy</a>
          </div>
          
          <div className="text-center md:text-right text-accent-foreground/80">
            <p>© 2025 iGOT Karmayogi | Government of India</p>
            <p className="text-xs mt-1">Last Updated: January 2025</p>
          </div>
        </div>

        {/* Government Branding */}
        <div className="mt-8 pt-6 border-t border-accent-foreground/20">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-accent-foreground/70">
            <span>An initiative of Mission Karmayogi</span>
            <span className="text-accent-foreground/40">|</span>
            <span>Capacity Building Commission, Government of India</span>
            <span className="text-accent-foreground/40">|</span>
            <span>Designed, Developed and Hosted by National Informatics Centre</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
