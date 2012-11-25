
Readium.Views.ReflowableElementInfo = Backbone.Model.extend({

    initialize : function () {},

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    // Currently for left-to-right pagination only
    findVisibleCharacterOffset : function($textNode, viewDocument) {

        var $parentNode;
        var elementTop;
        var elementBottom;
        var POSITION_ERROR_MARGIN = 5;
        var $document;
        var documentTop;
        var documentBottom;
        var percentOfTextOffPage;
        var characterOffset;

        // Get parent; text nodes do not have visibility properties.
        $parentNode = $textNode.parent();

        // Get document
        $document = $($("#readium-flowing-content", viewDocument).contents()[0].documentElement);

        // Find percentage of visible node on page
        documentTop = $document.position().top;
        documentBottom = documentTop + $document.height();

        elementTop = $parentNode.offset().top;
        elementBottom = elementTop + $parentNode.height();

        // Element overlaps top of the page
        if (elementTop < documentTop) {

            percentOfTextOffPage = Math.abs(elementTop - documentTop) / $parentNode.height();
            characterOffsetByPercent = Math.ceil(percentOfTextOffPage * $textNode[0].length);
            characterOffset = Math.ceil(0.5 * ($textNode[0].length - characterOffsetByPercent)) + characterOffsetByPercent;
        }
        // Element is full on the page
        else if (elementTop >= documentTop && elementTop <= documentBottom) {
            characterOffset = 1;
        }
        // Element overlaps bottom of the page
        else if (elementTop < documentBottom) {
            characterOffset = 1;
        }

        return characterOffset;
    },

    // TODO: Extend this to be correct for right-to-left pagination
    findVisibleTextNode: function (body, viewDocument, isTwoUp) {

        var documentLeft = 0;
        var documentRight;
        var columnGap;
        var columnWidth;
        var doc;
        var $elements;
        var $firstVisibleTextNode;

        // Rationale: The intention here is to get a list of all the text nodes in the document, after which we'll
        //   reduce this to the subset of text nodes that is visible on the page. We'll then select one text node
        //   for which we can create a character offset CFI. This CFI will then refer to a "last position" in the 
        //   EPUB, which can be used if the reader re-opens the EPUB.
        // REFACTORING CANDIDATE: The "audiError" check is a total hack to solve a problem for a particular epub. This 
        //   issue needs to be addressed.
        $elements = $("body", body).find(":not(iframe)").contents().filter(function () {
            if (this.nodeType === 3 && !$(this).parent().hasClass("audiError")) {
                return true;
            } else {
                return false;
            }
        });

        doc = $("#readium-flowing-content", viewDocument).contents()[0].documentElement;

        if (isTwoUp) {
            columnGap = parseInt($(doc).css("-webkit-column-gap").replace("px",""));
            columnWidth = parseInt($(doc).css("-webkit-column-width").replace("px",""));
            documentRight = documentLeft + columnGap + (columnWidth * 2);
        } 
        else {
            documentRight = documentLeft + $(doc).width();
        }

        // Find the first visible text node 
        $.each($elements, function() {

            var POSITION_ERROR_MARGIN = 5;
            var $textNodeParent = $(this).parent();
            var elementLeft = $textNodeParent.position().left;
            var elementRight = elementLeft + $textNodeParent.width();
            var nodeText;

            // Correct for minor right and left position errors
            elementLeft = Math.abs(elementLeft) < POSITION_ERROR_MARGIN ? 0 : elementLeft;
            elementRight = Math.abs(elementRight - documentRight) < POSITION_ERROR_MARGIN ? documentRight : elementRight;

            // Heuristics to find a text node with actual text
            nodeText = this.nodeValue.replace(/\n/g, "");
            nodeText = nodeText.replace(/ /g, "");

            if (elementLeft <= documentRight 
                && elementRight >= documentLeft
                && nodeText.length > 10) { // 10 is so the text node is actually a text node with writing - probably

                $firstVisibleTextNode = $(this);

                // Break the loop
                return false;
            }
        });

        return $firstVisibleTextNode;
    },

    findVisiblePageElements: function(view, body, document) {

        var $elements = $(body).find("[id]");
        var doc = $("#readium-flowing-content", document).contents()[0].documentElement;
        var doc_top = 0;
        var doc_left = 0;
        var doc_right = doc_left + $(doc).width();
        var doc_bottom = doc_top + $(doc).height();
        
        var visibleElms = this.filterElementsByPosition(view, $elements, doc_top, doc_bottom, doc_left, doc_right);
            
        return visibleElms;
    },

    // returns all the elements in the set that are inside the box
    filterElementsByPosition: function(view, $elements, documentTop, documentBottom, documentLeft, documentRight) {
        
        var $visibleElms = $elements.filter(function(idx) {
            var elm_top = $(view.el).offset().top;
            var elm_left = $(view.el).offset().left;
            var elm_right = elm_left + $(view.el).width();
            var elm_bottom = elm_top + $(view.el).height();
            
            var is_ok_x = elm_left >= documentLeft && elm_right <= documentRight;
            var is_ok_y = elm_top >= documentTop && elm_bottom <= documentBottom;
            
            return is_ok_x && is_ok_y;
        });  

        return $visibleElms;
    },



    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //


});