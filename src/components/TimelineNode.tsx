import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TimelineNodeProps {
  index: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const TimelineNode = ({ index, title, icon, children }: TimelineNodeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative flex items-start gap-8 w-full"
    >
      {/* Timeline connector */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0 pt-2">
        <div className="timeline-dot pulse-glow" />
      </div>

      {/* Content */}
      <div className="flex-1 glass-card-glow p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            {icon}
          </div>
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
              Node {index}
            </span>
            <h2 className="text-xl font-bold text-foreground glow-text">{title}</h2>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
};

export default TimelineNode;
