/*
    Copyright (C) 2016  Steve McKay

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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

