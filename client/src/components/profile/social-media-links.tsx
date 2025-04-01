import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn, FaGithub } from "react-icons/fa";
import { User } from "@shared/schema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { UseFormReturn } from "react-hook-form";

interface SocialMediaLinksViewProps {
  user: User;
  className?: string;
}

export const SocialMediaLinksView = ({ user, className = "" }: SocialMediaLinksViewProps) => {
  const socialLinks = [
    { url: user.twitterUrl, icon: FaTwitter, label: "Twitter", color: "text-[#1DA1F2]" },
    { url: user.facebookUrl, icon: FaFacebookF, label: "Facebook", color: "text-[#4267B2]" },
    { url: user.instagramUrl, icon: FaInstagram, label: "Instagram", color: "text-[#E1306C]" },
    { url: user.linkedinUrl, icon: FaLinkedinIn, label: "LinkedIn", color: "text-[#0077B5]" },
    { url: user.githubUrl, icon: FaGithub, label: "GitHub", color: "text-[#171515]" },
  ].filter((link) => link.url); // Filter out empty links

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full p-2 transition-all hover:bg-slate-100"
          aria-label={link.label}
        >
          <link.icon className={`h-5 w-5 ${link.color}`} />
        </a>
      ))}
    </div>
  );
};

interface SocialMediaLinksEditProps {
  form: UseFormReturn<any>;
}

export const SocialMediaLinksEdit = ({ form }: SocialMediaLinksEditProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const socialLinks = [
    {
      name: "twitterUrl",
      icon: FaTwitter,
      label: "Twitter",
      placeholder: "https://twitter.com/yourusername",
      color: "text-[#1DA1F2]",
    },
    {
      name: "facebookUrl",
      icon: FaFacebookF,
      label: "Facebook",
      placeholder: "https://facebook.com/yourusername",
      color: "text-[#4267B2]",
    },
    {
      name: "instagramUrl",
      icon: FaInstagram,
      label: "Instagram",
      placeholder: "https://instagram.com/yourusername",
      color: "text-[#E1306C]",
    },
    {
      name: "linkedinUrl",
      icon: FaLinkedinIn,
      label: "LinkedIn",
      placeholder: "https://linkedin.com/in/yourusername",
      color: "text-[#0077B5]",
    },
    {
      name: "githubUrl",
      icon: FaGithub,
      label: "GitHub",
      placeholder: "https://github.com/yourusername",
      color: "text-[#171515]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-700">Social Media Links</h3>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide" : "Edit"} Links
        </Button>
      </div>
      
      {!isExpanded && (
        <div className="flex flex-wrap gap-3">
          {socialLinks.map((link, index) => {
            const value = form.watch(link.name);
            return value ? (
              <div
                key={index}
                className="inline-flex items-center rounded-full p-2 bg-slate-100"
                aria-label={link.label}
              >
                <link.icon className={`h-5 w-5 ${link.color}`} />
              </div>
            ) : null;
          })}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
          {socialLinks.map((link) => (
            <FormField
              key={link.name}
              control={form.control}
              name={link.name}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <link.icon className={`mr-2 h-4 w-4 ${link.color}`} />
                    <FormLabel className="text-sm">{link.label}</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder={link.placeholder} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};