var casper = require('casper').create(),
    x = require('casper').selectXPath,
    url = casper.cli.get('url'),
    username = casper.cli.get('username'),
    password = casper.cli.get('password'),
    sendTroopsPositions = [];

var USERNAME_SELECTOR = '.account .text',
    PASSWORD_SELECTOR = '.pass .text',
    WAIT_TIME = 10000,
    UNREAD_REPORTS_SELECTOR = '#n5 .speechBubbleContainer',
    REPORTS_SELECTOR = '#n5 a',
    UNREAD_REPORT_IN_PAGE_SELECTOR = 
        x('//*[contains(@class, "messageStatusUnread")]/../div/a'),
    NEXT_PAGE_SELECTOR = '.next',
    RESOURCES_SELECTOR = '#n1 a.inactive';

casper.userAgent('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:30.0) Gecko/20100101 Firefox/30.0');

casper.start(url, function() {
    _initSendTroopsPositions();
    login();
});

casper.then(infiniteLoop);

function infiniteLoop() {
    casper.wait(WAIT_TIME, doLoop);
    casper.then(infiniteLoop);
}

function login() {
    // Send username to field.
    casper.sendKeys(USERNAME_SELECTOR, username);
    // Send password to field.
    casper.sendKeys(PASSWORD_SELECTOR, password);
    // Click login button
    casper.click('#s1');
}

function doLoop() {
    goToResources();
    casper.then(function() {
        if (unreadReports()) {
            goToReports();
            casper.then(function() {
                if (unreadReports()) {
                    goToUnreadReport();
                    takeAction();
                }
            });
        } else {
 //           buildPorras();
        }
    });
}

function goToResources() {
    casper.then(function() {
        casper.click('#n1 a');
    });
}

function unreadReports() {
    casper.capture('unread.png');
    return casper.exists(UNREAD_REPORTS_SELECTOR);
}

function goToReports() {
    casper.then(function() {
        casper.click(REPORTS_SELECTOR);
    });
}

function unreadReportInCurrentPage() {
    return casper.exists(UNREAD_REPORT_IN_PAGE_SELECTOR);
}

function goToUnreadReport() {
    casper.then(function() {
        var unread = unreadReportInCurrentPage();
        casper.echo('UNREAD ' + unread);
	casper.capture('queveo.png');
        if (unread) {
            casper.click(UNREAD_REPORT_IN_PAGE_SELECTOR);
        } else {
            if (unreadReports()) {
                casper.thenClick(NEXT_PAGE_SELECTOR, goToUnreadReport);
            }
        }
    });
}

function takeAction() {
    casper.then(function() {
        if (attackSelector() && !isEspionageReport()) {
            if (!troopsDied()) {
                resendTroops();
            }
        }
    });
}

function attackSelector() {
    return casper.exists(x('//*[@id="attacker"]//a[text()="' +
        username + '"]'));
}

function isEspionageReport() {
    return casper.exists(x('//*[@id="attacker"]//*[@class="units"][2]//td[4][text() != "0"]'));
}

function troopsDied() {
    return casper.exists(x('//*[@id="attacker"]//*' +
        '[@class="units last"]//td[text() != "0"]'));
}

function _initSendTroopsPositions() {
    sendTroopsPositions[1] = { row : 1, col : 1 };
    sendTroopsPositions[2] = { row : 2, col : 1 };
    sendTroopsPositions[3] = { row : 3, col : 1 };
    sendTroopsPositions[4] = { row : 1, col : 2 };
    sendTroopsPositions[5] = { row : 2, col : 2 };
    sendTroopsPositions[6] = { row : 3, col : 2 };
    sendTroopsPositions[7] = { row : 1, col : 3 };
    sendTroopsPositions[8] = { row : 2, col : 3 };
    sendTroopsPositions[9] = { row : 1, col : 4 };
    sendTroopsPositions[10] = { row : 2, col : 4 };
    sendTroopsPositions[11] = { row : 3, col : 4 };

}

function resendTroops() {
    var amounts = [];
    for (var i = 1 ; i <= 10 ; i++) {
        amounts[i] = casper.fetchText(x('(//*[@id="attacker"]//td[@class="unit"])[' + i + ']'));
    }
    var def = casper.fetchText(x('//div[@class="role" and text()="Defender"]' +
        '/ancestor::tr[1]//a[2]'));
    casper.thenClick(x('//div[@class="role" and text()="Defender"]' +
        '/ancestor::tr[1]//a[2]'), function() {
        casper.clickLabel('Send troops');
        casper.then(function() {
            for (var i = 1 ; i <= 10 ;i++) {
                var send = sendTroopsPositions[i];
                casper.sendKeys(x('//*[@id="troops"]//tr[' + send.row  + ']//td[' + send.col + ']//input'),
                    amounts[i]); 
            }
            casper.click(x('//*[@class="radio" and @value="4"]'));
            casper.capture('sending.png');
            casper.thenClick('#btn_ok', function() {
                if (!casper.exists(x('//*[@class="units"]//td[text()="1"]'))) {
                    casper.click('#btn_ok');
                    casper.capture('sent->' + def + '.png');
                }
            });
        });
    });
}

function buildPorras() {
    casper.then(function() {
        casper.thenClick('#n2 a', function() {
            casper.thenClick('area[href="build.php?id=33"]', function() {
                casper.click(x('//*[@class="details"]/a'));
                casper.click('#s1');
            });
        });
    });
}

casper.run();
