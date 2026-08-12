export default function MobilePlaceholder({ title = "App" }) {
  return (
    <div className="mobile-app-scroll flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Full {title} experience is available on the desktop shell.
      </p>
    </div>
  );
}
