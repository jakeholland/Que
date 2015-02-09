using System.Web;
using System.Web.Optimization;

namespace Que
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-2.*"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include(
                        "~/Scripts/jquery-ui*"));


            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));


            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/site.css"));


            bundles.Add(new StyleBundle("~/Content/themes/base/css").Include(
                        "~/Content/themes/base/jquery.ui.core.css",
                        "~/Content/themes/base/jquery.ui.resizable.css",
                        "~/Content/themes/base/jquery.ui.selectable.css",
                        "~/Content/themes/base/jquery.ui.accordion.css",
                        "~/Content/themes/base/jquery.ui.autocomplete.css",
                        "~/Content/themes/base/jquery.ui.button.css",
                        "~/Content/themes/base/jquery.ui.dialog.css",
                        "~/Content/themes/base/jquery.ui.slider.css",
                        "~/Content/themes/base/jquery.ui.tabs.css",
                        "~/Content/themes/base/jquery.ui.datepicker.css",
                        "~/Content/themes/base/jquery.ui.progressbar.css",
                        "~/Content/themes/base/jquery.ui.theme.css"));

            bundles.Add(new ScriptBundle("~/Scripts/bootstrap").Include("~/Scripts/bootstrap.min.js"));
            bundles.Add(new StyleBundle("~/Content/bootstrap").Include("~/Content/bootstrap.min.css"));

            bundles.Add(new ScriptBundle("~/Scripts/chartist").Include("~/Scripts/chartist.min.js"));
            bundles.Add(new StyleBundle("~/Content/chartist").Include("~/Content/chartist.min.css"));

            bundles.Add(new ScriptBundle("~/Scripts/bootstrapValidator").Include("~/Scripts/bootstrapValidator.min.js"));
            bundles.Add(new StyleBundle("~/Content/bootstrapValidator").Include("~/Content/bootstrapValidator.min.css"));

            bundles.Add(new ScriptBundle("~/Scripts/justgage").Include("~/Scripts/justgage.1.0.1.min.js","~/Scripts/raphael.2.1.0.min.js"));

            bundles.Add(new ScriptBundle("~/Scripts/moment").Include("~/Scripts/moment.js"));

            bundles.Add(new ScriptBundle("~/Scripts/knockout").Include("~/Scripts/knockout-{version}.js"));

            bundles.Add(new ScriptBundle("~/Scripts/parse").Include("~/Scripts/parse-1.3.1.min.js"));

            bundles.Add(new ScriptBundle("~/Scripts/sammy").Include("~/Scripts/sammy-{version}.js"));

            bundles.Add(new ScriptBundle("~/Scripts/main").Include("~/Scripts/main.js"));
        }

        
    }
}