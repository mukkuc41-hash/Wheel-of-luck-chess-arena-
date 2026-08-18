import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Wheel of Luck Chess Arena | Play Duo Chess Online & Multiplayer',
  description = 'Play Duo Chess online in the Wheel of Luck Chess Arena. Enjoy random duo matchmaking, live multiplayer, puzzles, tactical AI analysis, and global leaderboards.',
  canonicalUrl = 'https://playduochess.ai.studio/',
  ogImage = 'https://playduochess.ai.studio/og-image.png',
}) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [key, val] = selector.replace('meta[', '').replace(']', '').split('=');
        element.setAttribute(key, val.replace(/["']/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Helper function to update link tags
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Meta Description
    updateMetaTag('meta[name="description"]', 'content', description);

    // Canonical
    updateLinkTag('canonical', canonicalUrl);

    // Open Graph
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);

    // Twitter Card
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);
  }, [title, description, canonicalUrl, ogImage]);

  return null;
};
