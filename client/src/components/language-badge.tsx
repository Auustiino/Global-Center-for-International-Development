import { Badge, BadgeProps } from "@/components/ui/badge";
import { LANGUAGE_OPTIONS, PROFICIENCY_OPTIONS } from "@shared/schema";

interface LanguageBadgeProps extends BadgeProps {
  language: string;
  proficiency?: string;
  showLabel?: boolean;
}

const LanguageBadge = ({
  language,
  proficiency,
  showLabel = true,
  ...props
}: LanguageBadgeProps) => {
  const languageLabel = LANGUAGE_OPTIONS.find(
    (option) => option.value === language
  )?.label || language;

  const proficiencyLabel = proficiency
    ? PROFICIENCY_OPTIONS.find((option) => option.value === proficiency)?.label
    : null;

  return (
    <Badge 
      variant="outline" 
      className="px-2 py-1 bg-slate-100 text-xs font-medium rounded-full"
      {...props}
    >
      {showLabel ? languageLabel : ""}
      {proficiency && (
        <span className="ml-1 text-xs bg-slate-200 px-1 py-0.5 rounded-full">
          {proficiencyLabel}
        </span>
      )}
    </Badge>
  );
};

export default LanguageBadge;
