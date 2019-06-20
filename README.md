# bach-dictation-generator
The bach dictation generator is a project proposed by **Andrew Hauze** for the 2019 Swarthmore College Projects for Educational Exploration and Development ([SPEED](https://www.swarthmore.edu/its/swarthmore-projects-educational-exploration-and-development-speed-program)). The project is led by Ashley Turner and Roberto Vargas of Swarthmore College, as well as Katie Knox ('21) and Alice Huang ('22). 

The bach dictation generator is a tool that enables Swarthmore music students to prepare for the ear training exams that students must take in applying for graduate programs in conducting. Students will be able to listen to different mixes of Bach Chorales to practice identifying each of the four voices. The web platform that houses this tool enables users to change the instrument for each of the four parts, as well as adjust the volume of the higher vs. lower pitches. There is also a mechanism to adjust the tempo. 

## Motivation
The key motivator for this project is that it automates a process that would be extremely tedious to complete by hand using the music notation software Sibelius. Without the bach dictation generator, Andrew must split each Bach Chorale from two parts into four voices using Sibelius' 'explode' plugin. He would then manually adjust the instrument, volume, etc. for each part.   

## Research
Andrew provided us with a link to around [400 Bach Chorales](https://imslp.org/wiki/Special:ReverseLookup/238728) in the MIDI format. We strived to determine:
  1. Is there a way to edit the Bach Chorales in large batches (instead of doing so individually using Sibelius)?
  2. Do we need to utilize other formats for the files, such as XML, JSON, or FFmpeg?
  3. Can we automate the process of mixing the Bach Chorales? 
  4. Can we put these tools and files on a web platform? 

**Converting MIDI Files to XML**
Since the MIDI files Andrew provided are in two parts, we tried to find a way to split them into four voices (four separate staves in the score) in batches. 
  * We did not find a way to split the MIDI files into four voices in large batches 
  * We found that [MuseScore](https://musescore.org/en), a free version of Sibelius, does enable us to batch convert MIDI files to XML
  * We would then be able to write some kind of program that would split the staves in the XML - *our question at this point was about       how we would determine the split between soprano/alto and tenor/bass in writing the program since it doesn't always depend on the       stem direction of the notes* - *we also couldn't reference Sibelius' methods since it is not open source*
  
**Finding Bach Chorales in 4 Voices**
It seemed there would be a lot of questions and complexities in trying to write a program to split the files into four voices, so we  tried to look beyond the Bach Chorales in the link that Andrew provided.
  * We found that Margaret Greentree's website is largely referenced as a near-complete set of Bach Chorales in four voices -               unfortunately, her website no longer exists and our email to her bounced back  
  * We also found many Bach Chorales in four voices in PDF format - *there is software to convert from PDF to XML but it requires a         lot of manual, tedious steps* 
  * Finally, we found [music21](https://web.mit.edu/music21/doc/about/what.html), which is a Python-based tool that was created to help     people analyze large numbers of pieces and includes Greentree's Bach Chorales - this tool helped us in a few ways:
      1. It has around 400 Bach Chorales in four voices - accessed using `from music21 import *` in Python 
      2. These Bach Chorales can be downloaded in MIDI or XML format - *we can then open them in MuseScore*
At this point, our concerns were whether these were the same Bach Chorales Andrew wanted to use (there might be some overlap between the two collections) and whether we could find a way to set different instruments for each of the four voices 

**Playing the Files**
Meanwhile, we also found a number of examples for MIDI players that we could use to put the bach dictation generator on a website. 
  1. [MidiPlayerJS](http://grimmdude.com/MidiPlayerJS/) - *this works in 2 steps, first converting MIDI files to JSON events and then        using WebAudio to play the audio* - *we liked this because it also lets you adjust the tempo*
      * [GitHub repo for step 1](https://github.com/grimmdude/MidiPlayerJS)
      * [GitHub repo for step 2](https://github.com/danigb/soundfont-player) 
  2. [WebAudioFont Midi Player](https://surikov.github.io/webaudiofont/examples/midiplayer.html#) - *we liked this one because it shows      the different channels for the MIDI file and allows you to adjust the instrument and volume for each channel* 
      * [GitHub repo](https://github.com/surikov/webaudiofont) 
      
**Parsing the Files**
The second MIDI player we found looked a lot like our desired end product with the different channels. However, if we converted one of the Bach Chorales from music21 into MIDI and uploaded it to this site, it would only show up as one channel even though there are four voices. 
  * We found this [Bach Parse Example](https://gist.github.com/kastnerkyle/682979133e732c4cd3ab9467e5c70273) that uses music21 and           parses all the Bach Chorales into four separate voices in MXL (so they would show up as four channels in the MIDI player) 
  
## Summary
Now we have ~400 Bach Chorales in four voices in MXL, which we batch converted to MIDI using MuseScore. If we upload these to the WebAudioFont Midi Player, we can perform all the instrument and volume changes we need. Next steps:
  * Edit script for files so there are only two channels (Andrew only wants to be able to control the high vs. low voices, not each         individually)
  * Update the MIDI player so user can choose from a list of chorales
  * Fix the volume adjustment tool to make changes more noticeable 
  * Reduce the number of instrument options
  * Add an optional score visualization that goes along with the audio
  * Add some form of the tempo adjustment tool that MidiPlayerJS uses 
  * Create an easy way for Andrew to add more chorales in the future 
