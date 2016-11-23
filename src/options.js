var imgBlockOptions = angular.module('imgBlockOptions', []);

imgBlockOptions.controller('OptionsController', $scope => {
    $scope.selected_domains = [];
    $scope.settings = window.settings;

    [
        'enabled',
        'click_action',
        'temporary_duration',
        'whitelist_domains',
        'blacklist_domains'
    ].forEach(prop => $scope.$watch(prop, (newValue, oldValue) => {
        settings.set(prop, newValue);
    }, true));

    $scope.settings.addListener(knobs => {
        $scope.enabled = knobs.enabled;
        $scope.click_action = knobs.click_action;
        $scope.temporary_duration = knobs.temporary_duration;
        $scope.whitelist_domains = knobs.whitelist_domains.slice();
        $scope.blacklist_domains = knobs.blacklist_domains.slice();
        $scope.$applyAsync();
    });
});

imgBlockOptions.directive('domainList', () => {
    return {
        restrict: 'E',
        scope: {
            'domains': '=',
            'title': '@'
        },
        link: scope => {
            scope.title = chrome.i18n.getMessage(scope.title);
            scope.selected_domains = [];

            scope.removeSelected = () => {
                scope.domains = scope.domains.filter(domain => {
                    return scope.selected_domains.indexOf(domain) < 0;
                });
                scope.selected_domains = [];
            };
        },
        templateUrl: 'domain-list.html'
    };
});

imgBlockOptions.directive('i18nContent', () => {
    return {
        restrict: 'A',
        scope: {
            i18nContent: '@'
        },
        link: (scope, element, attrs) => {
            element.text(chrome.i18n.getMessage(scope.i18nContent));
        }
    };
});

