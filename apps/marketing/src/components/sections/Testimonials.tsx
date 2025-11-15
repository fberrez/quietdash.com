import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'r/digitalminimalism',
    role: '703 upvotes, 59k views',
    initials: 'HU',
    quote:
      'I love this! If there was something like this to buy, I would buy it. Could you maybe make a guide for dummies how to make this? :)',
    rating: 5,
    link: 'https://www.reddit.com/r/digitalminimalism/comments/1ow6l2g/comment/nonu1xr',
    username: 'u/human-computer-04',
    avatar: '/testimonials/reddit/human-computer-04.png',
  },
  {
    name: 'r/digitalminimalism',
    role: 'Top comment',
    initials: 'AG',
    quote: 'Sincerely, register the patent and sell this, the product is excellent!',
    link: 'https://www.reddit.com/r/digitalminimalism/comments/1ow6l2g/comment/noq7rla/',
    username: 'u/AutomaticGlass7295',
    avatar: '/testimonials/reddit/AutomaticGlass7295.png',
    rating: 5,
  },
  {
    name: 'r/fuckcars',
    role: 'Healthcare sector',
    initials: 'IN',
    quote:
      'This is such a great idea! Such a nice nudge if you work somewhere like a hospital to put something like this in the staff room.',
    username: 'u/interrogumption',
    avatar: '/testimonials/reddit/interrogumption.png',
    link: 'https://www.reddit.com/r/fuckcars/comments/1ossabs/comment/nof620v',
    rating: 5,
  },
  {
    name: 'r/ProductivityApps',
    role: 'Knowledge worker',
    initials: 'EK',
    quote: 'Can we order this some how? This looks amazing',
    username: 'u/Economy-King6474',
    link: 'https://www.reddit.com/r/ProductivityApps/comments/1ow1cm5/comment/nomxk0s/',
    rating: 5,
  },
  {
    name: 'Bluesky',
    role: 'Design community',
    initials: 'NC',
    username: '@nutriclarity.bsky.social',
    link: 'https://bsky.app/profile/nutriclarity.bsky.social/post/3m5c5tafnjk23',
    avatar: '/testimonials/bluesky/@nutriclarity.bsky.social.png',
    quote:
      'Looks super clean! The challenge is always taking complex data and making it glanceable and intuitive. Great work on distilling the portfolio view down to the essentials.',
    rating: 5,
  },
  {
    name: 'r/AppleWatchFitness',
    role: 'Fitness enthusiast',
    initials: 'JE',
    quote:
      "Please make a write up on how to make one of these. I'd love to have 1 of these! Or make a few and sell them here / Etsy…?",
    username: 'u/Just-Eddie83',
    avatar: '/testimonials/reddit/Just-Eddie83.png',
    link: 'https://www.reddit.com/r/AppleWatchFitness/comments/1ovx76s/comment/nomuq6z',
    rating: 5,
  },
  {
    name: 'r/ProductivityApps',
    role: 'Remote worker',
    initials: 'SP',
    quote:
      "the e-ink is so smart bc you don't have another screen competing for your attention with notifications.. i'd love to see how it tracks deep work hours without being intrusive.",
    username: 'u/Spaith',
    avatar: '/testimonials/reddit/Spaith.png',
    link: 'https://www.reddit.com/r/ProductivityApps/comments/1ow1cm5/comment/nomr6ed/',
    rating: 5,
  },
  {
    name: 'r/GetMotivated',
    role: 'Developer',
    initials: 'NB',
    quote: 'This is insanely cool, I kind of want one for my phone use.',
    username: 'u/Nick_Beard',
    avatar: '/testimonials/reddit/Nick_Beard.png',
    link: 'https://www.reddit.com/r/GetMotivated/comments/1ov5c5d/comment/nokiwzd/',
    rating: 5,
  },
  {
    name: 'r/digitalminimalism',
    role: 'Community member',
    initials: 'RA',
    quote: 'Damn, this is absolutely amazing! Definitely would look into it',
    username: 'u/RoundAnalysis4',
    link: 'https://www.reddit.com/r/digitalminimalism/comments/1ow6l2g/comment/nos4sl6',
    avatar: '/testimonials/reddit/RoundAnalysis4.png',
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonials)[0] }) => (
  <Card className="group relative overflow-hidden border bg-card/50 backdrop-blur transition-all hover:shadow-xl hover:border-primary/20 flex flex-col h-[320px] w-[350px] sm:w-[400px] shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardContent className="relative p-6 flex flex-col flex-1 space-y-4">
      {/* Rating */}
      <div className="flex gap-1">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4" style={{ fill: '#E17100', color: '#E17100' }} />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-base text-foreground leading-relaxed flex-1 font-medium">
        "{testimonial.quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background">
          {testimonial.avatar && (
            <AvatarImage src={testimonial.avatar} alt={testimonial.username || testimonial.name} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {testimonial.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          {testimonial.username ? (
            <>
              {testimonial.link ? (
                <a
                  href={testimonial.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:text-primary transition-colors leading-tight"
                >
                  {testimonial.username}
                </a>
              ) : (
                <span className="text-sm font-semibold leading-tight">{testimonial.username}</span>
              )}
              <span className="text-xs text-muted-foreground mt-0.5">{testimonial.name}</span>
              {testimonial.role && (
                <span className="text-xs text-muted-foreground">{testimonial.role}</span>
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-semibold leading-tight">{testimonial.name}</span>
              {testimonial.role && (
                <span className="text-xs text-muted-foreground mt-0.5">{testimonial.role}</span>
              )}
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Testimonials() {
  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            "I would actually buy this."
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            When we shared VITRINE on Reddit and Bluesky, thousands of people had the same reaction:{' '}
            <em>Finally.</em>
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Gradient fade on left */}
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent z-10 pointer-events-none" />
          {/* Gradient fade on right */}
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent z-10 pointer-events-none" />
          <div className="flex gap-4 animate-marquee will-change-transform">
            {duplicatedTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${index}-${testimonial.username || testimonial.name}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>

        {/* Social Proof Counter */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div>
              <span className="font-bold text-2xl">1,080</span>
              <span className="text-muted-foreground ml-1">total upvotes</span>
            </div>
            <div>
              <span className="font-bold text-2xl">120k+</span>
              <span className="text-muted-foreground ml-1">views</span>
            </div>
            <div>
              <span className="font-bold text-2xl">150+</span>
              <span className="text-muted-foreground ml-1">comments</span>
            </div>
            <div>
              <span className="font-bold text-2xl">97%</span>
              <span className="text-muted-foreground ml-1">avg. upvote ratio</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">From Reddit and Bluesky.</p>
        </div>
      </div>
    </section>
  );
}
