// a template (unlike a layout) remounts on every navigation, so the page animates in each time
export default function Template({ children }) {
  return <div className="anim-page">{children}</div>;
}
