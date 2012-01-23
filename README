# nwxforms



## [Demo 1](http://dl.dropbox.com/u/598365/html5forms/html5forms.html)

## [Demo 2](http://dl.dropbox.com/u/598365/html5forms/example1.html)
 

      <p class="status">Currently the code aims to support the following new HTML5 input types
      <code>color</code>, <code>range</code>, <code>search</code>, <code>number</code>, <code>email</code>,
      <code>url</code>, <code>date</code>, <code>time</code>, <code>week</code>, <code>datetime</code>,
      <code>datetime-local</code> and most of the new standard HTML5 form attributes like
      <code>autofocus</code>, <code>required</code>, <code>placeholder</code> and <code>pattern</code>
      on different control elements and add support for the <code>maxlength</code> attribute on
      <code>&lt;textarea&gt;</code> elements (already supported by HTML4 on
      <code>&lt;input&gt;</code> elements).</p>

      <p>The objective is to allow authors to use most HTML5 control types and attributes even in browsers
      which do not yet support all these new HTML5 features. Some of these features are only implemented
      in the latest version of Opera and partially in Webkit based browsers. To achieve this we need the
    ability to recognize and handle correct validation for these new types and be able to set:</p>

      <ul>
        <li><code>autofocus</code> attribute for <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code> or <code>&lt;textarea&gt;</code> elements</li>
        <li><code>required</code> attribute for <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code> or <code>&lt;textarea&gt;</code> elements</li>
        <li><code>placeholder</code> attribute values for <code>&lt;input&gt;</code> or <code>&lt;textarea&gt;</code> elements</li>
        <li><code>pattern</code> attribute values for <code>&lt;input&gt;</code> elements</li>
        <li><code>data-regexp</code> attribute values for <code>&lt;input&gt;</code> elements (non standard)</li>
      </ul>

      <p>The <code>autofocus</code> and <code>required</code> attributes are of type boolean (true/false).
      The following are three different methods of including boolean attributes in the HTML code, I
      would reccommend you use one of the first two methods but I know picky browsers exists:</p>

      <ul>
        <li><code>&lt;input required&gt;</code> only using the name of the boolean attribute</li>
        <li><code>&lt;input required=""&gt;</code> setting its value to be an empty quoted value</li>
        <li><code>&lt;input required="required"&gt;</code> using the attribute name as the value</li>
      </ul>

      <p>There may be more than one <code>autofocus</code> element for each form in the page, however
      only the last <code>autofocus</code> element (in document order) will be focused after the
      form initialization has completed.</p>

      <p>The example <code>placeholder</code> value:</p>

      <ul>
        <li>must not be included in parameters with form submission</li>
        <li>should be visually removed when user gives focus to the field</li>
        <li>should be visually different, suggesting it is only an example value</li>
        <li>should be returned if no value is provided and after the field is blurred</li>
        <li>should be applied after the browser has retrieved prior submission values</li>
      </ul>

      <p>The validation <code>pattern</code> value:</p>

      <ul>
        <li>must match the field value before the form can be submitted</li>
        <li>should be visually accessible through the same field <code>title</code> attribute</li>
        <li>should be visually different when focused, suggesting the field is mandatory</li>
      </ul>

      <p>The code is just baked so it surely need more testing and tweakings for various browsers.</p>

      <ul>
        <li>HTML test and example courtesy by @ls_n (Luke Smith)</li>
        <li>Initial Javascript helper code by @rem (Remy Sharp)</li>
        <li>Testing and support by @mathias (Mathias Bynens)</li>
        <li>Suggestions on html5 by @miketaylr (Mike Taylor)</li>
        <li>Ideas and more testing @digitarald (Harald Kirschner)</li>
      </ul>

      <h3>Known Limitations</h3>
      <ul>
        <li>in very old browsers the maxLength attribute will also limit the length of the visible placeholder text</li>
        <li>there is no way to type exactly the same placeholder strings in the fields but shouldn't be a problem</li>
        <li>to debug this code it is highly suggested not to use alert() since it affects focus/blur states</li>
      </ul>