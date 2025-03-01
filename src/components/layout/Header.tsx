
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  className?: string;
  rightContent?: React.ReactNode;
}

export function Header({ 
  title, 
  description, 
  className,
  rightContent
}: HeaderProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-6 pb-4 border-b",
      className
    )}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}

export default Header;
