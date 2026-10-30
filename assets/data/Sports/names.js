const maleFirstNames = [
    'Aaron','Adam','Adrian','Aiden','Alan','Albert','Alejandro','Alex','Alexander','Alfred',
    'Ali','Allan','Allen','Alonso','Alvin','Andre','Andrew','Andy','Angel','Angelo',
    'Anthony','Antonio','Archer','Archie','Arnold','Aron','Arthur','Arturo','Asa','Axel',
    'Austin','Bailey','Barry','Beau','Ben','Benjamin','Bennett','Bentley','Bernard','Bert',
    'Blaine','Blake','Booker','Bradley','Brady','Bram','Brandon','Brantley','Braxton','Brendan',
    'Brett','Brian','Brooks','Bruce','Bruno','Bryce','Brycen','Buster','Byron','Caleb',
    'Calvin','Cameron','Cade','Caden','Caiden','Camden','Carl','Carlo','Carlos','Carson',
    'Carter','Casey','Cecil','Cedric','Cesar','Chad','Chandler','Charles','Charlie','Chase',
    'Chester','Chip','Chris','Christian','Christopher','Chuck','Clarence','Clark','Claude','Clay',
    'Clayton','Clifford','Clint','Cody','Colby','Cole','Colin','Collin','Colton','Connor',
    'Conrad','Corey','Craig','Cruz','Cyrus','Damian','Dane','Daniel','Danny','Dante',
    'Daren','Darius','Darren','Darryl','Dave','David','Dean','Deandre','Devin','Diego',
    'Dominic','Donald','Donovan','Doug','Douglas','Dylan','Deshawn','Desmond','Deontae','Derek',
    'Derick','Derrick','Dillon','Dirk','Don','Dustin','Dwayne','Dwight','Earl','Easton',
    'Edgar','Eduardo','Edward','Edwin','Eli','Elias','Elijah','Elliot','Ellis','Elmer',
    'Elmo','Elroy','Elton','Elvin','Emmanuel','Emerson','Emery','Emil','Emilio','Emmet',
    'Emmett','Enrique','Erick','Erik','Ernest','Ernesto','Ethan','Eugene','Evan','Everett',
    'Ezekiel','Ezra','Fabian','Felipe','Felix','Fernando','Finn','Floyd','Ford','Forest',
    'Forrest','Francis','Frank','Frankie','Franklin','Freddy','Frederick','Fritz','Francisco','Gabriel',
    'Gael','Gage','Gary','Gene','Geoffrey','George','Gerald','Gerard','Gerardo','Gideon',
    'Gilbert','Glenn','Gordon','Grady','Graham','Grant','Grayson','Greg','Gregg','Gregory',
    'Griffin','Grover','Gus','Guy','Hakeem','Hank','Hans','Harlan','Harold','Harry',
    'Harvey','Heath','Hector','Henry','Herbert','Herman','Hiram','Homer','Horace','Howard',
    'Hoyt','Hugh','Hugo','Hunter','Hyman','Ian','Ibrahim','Ignacio','Ike','Ira',
    'Irvin','Irving','Irwin','Isaac','Isaiah','Isiah','Ivan','Izaiah','Jabari','Jack',
    'Jackie','Jackson','Jacob','Jacquan','Jaden','Jaeden','Jaime','Jake','Jalen','Jamal',
    'James','Jameel','Jamil','Jared','Jarod','Jarvis','Jason','Jasper','Jay','Jayden',
    'Jaylen','Jayson','Jean','Jeff','Jeffery','Jeffrey','Jensen','Jerald','Jeremiah','Jeremy',
    'Jerome','Jerry','Jesse','Jessie','Jesus','Jim','Jimmie','Jimmy','Joaquin','Jody',
    'Joe','Joel','John','Johnny','Jon','Jonah','Jonas','Jonathan','Jones','Jordan',
    'Jose','Joseph','Joshua','Josiah','Juan','Jude','Judson','Julian','Julio','Julius',
    'Junior','Justice','Justin','Kaiden','Kale','Kameron','Kane','Kareem','Karl','Karson',
    'Kasen','Kash','Kason','Kayden','Keith','Kellan','Kellen','Kelly','Kelvin','Kendal',
    'Kendall','Kendrick','Ken','Kenneth','Kenny','Kent','Kevin','Khalil','Kian','Kiefer',
    'Kiel','Kieran','Kim','King','Kingston','Kirk','Kit','Knox','Kobe','Kody',
    'Kolby','Korbyn','Kraig','Kris','Kristofer','Kurt','Kyler','Kyle','Kyson','Lamar',
    'Lamont','Lance','Landon','Larry','Lars','Lawrence','Lee','Leland','Lennox','Leo',
    'Leon','Leonard','Leonardo','Leonel','Leopold','Leroy','Les','Lester','Levi','Lewis',
    'Liam','Lincoln','Lionel','Lloyd','Logan','Lonnie','Loren','Lorenzo','Lou','Louis',
    'Louie','Lowell','Lucas','Luciano','Luis','Luke','Luther','Lyndon','Mac','Mack',
    'Malcolm','Malik','Manuel','Marc','Marcel','Marcus','Mariano','Mario','Mark','Markus',
    'Marlon','Marshall','Martin','Marty','Marvin','Mason','Mateo','Matt','Matteo','Matthew',
    'Maurice','Mauro','Maverick','Max','Maxwell','Maynard','McKinley','Mel','Melvin','Merle',
    'Micah','Michael','Micheal','Mike','Mikel','Miles','Milo','Milton','Minor','Mitch',
    'Mitchell','Modesto','Mohamed','Mohammad','Montague','Monte','Monty','Morgan','Morris','Moses',
    'Murphy','Murray','Myles','Myron','Nathan','Nathaniel','Neil','Nelson','Nestor','Nico',
    'Nigel','Noah','Nolan','Norman','Omar','Pablo','Parker','Pascal','Pat','Patrick',
    'Paul','Paulo','Percy','Perry','Pete','Peter','Philip','Phillip','Pierre','Porter',
    'Preston','Quentin','Rafael','Ralph','Ramiro','Ramon','Randall','Randolph','Randy','Ray',
    'Raymond','Reed','Reginald','Rene','Reuben','Rex','Ricardo','Richard','Rico','Riley'
];

const femaleFirstNames = [
    'Abigail','Adeline','Adriana','Aileen','Aimee','Aisha','Aja','Akasha','Alana','Alannah',
    'Alberta','Alecia','Aleandra','Alesha','Alessia','Alex','Alexa','Alexandra','Alexandria','Alexia',
    'Alexis','Alia','Alice','Alicia','Alina','Alison','Allison','Ally','Allyson','Alma',
    'Aloy','Alondra','Alpha','Alta','Althea','Alva','Alvina','Alyce','Alycia','Alysa',
    'Alyssa','Alyvia','Amalia','Amanda','Amara','Amaya','Amber','Amelia','Amethyst','Amie',
    'Amina','Amy','Ana','Anabel','Anabelle','Anahi','Anastasia','Andrea','Angela','Angelica',
    'Angelina','Angie','Anita','Ann','Anna','Annabel','Annabeth','Annette','Annie','Annora',
    'Anora','Antoinette','Antonia','April','Aria','Ariana','Arianna','Ariel','Ariella','Arielle',
    'Arlene','Arlette','Armida','Arnette','Arya','Ashanti','Ashlee','Ashleigh','Ashley','Ashton',
    'Asia','Aspen','Astra','Astrid','Athena','Aubrey','Aubrie','Audra','Audrey','Augusta',
    'Aurelia','Aurora','Autumn','Ava','Avalon','Avery','Avril','Ayesha','Azalea','Azura',
    'Bailey','Barbara','Beatrice','Becca','Becky','Bella','Belle','Belinda','Benita','Bertha',
    'Bess','Bessie','Beth','Bethany','Betsy','Bette','Betty','Beulah','Beverly','Bianca',
    'Billie','Birdie','Blair','Blake','Blanca','Blanche','Bonita','Bonnie','Brandi','Brandy',
    'Brenda','Brenna','Brianna','Brielle','Bridget','Bridgette','Brigitte','Brina','Bristol','Brooke',
    'Brooklyn','Bryanna','Brylee','Brynlee','Buffy','Buttercup','Caitlin','Caitlyn','Calista','Callie',
    'Calypso','Camila','Camille','Candace','Candice','Cara','Carey','Caridad','Carla','Carlee',
    'Carleigh','Carley','Carli','Carlie','Carly','Carmen','Carol','Carole','Carolina','Caroline',
    'Carrie','Casandra','Casey','Cassie','Cassidy','Cassandra','Cate','Catherine','Cathy','Cecelia',
    'Cecile','Celia','Celeste','Celine','Cerise','Chana','Chanda','Chanel','Chanelle','Charity',
    'Charla','Charlene','Charlotte','Charmaine','Chasity','Chelsea','Cher','Cherie','Cheryl','Chloe',
    'Chris','Christal','Christa','Christabel','Christina','Christy','Chrystal','Cindy','Claire','Clara',
    'Clarabelle','Clarissa','Claudia','Clementine','Cleo','Cleopatra','Clio','Coco','Coral','Cordelia',
    'Corina','Corinne','Crystal','Cynthia','Cyrilla','Dacey','Dacia','Daisy','Dakota','Dale',
    'Dana','Dani','Dania','Daniela','Daphne','Dara','Darla','Darlene','Darby','Daria',
    'Davina','Dawn','Dayana','Dayna','Deb','Debbie','Deborah','Debra','Delaney','Delilah',
    'Della','Delma','Delores','Delta','Demetra','Denise','Diana','Diane','Didi','Dina',
    'Dinah','Dione','Dixie','Dolores','Dolly','Dona','Dora','Doreen','Doris','Dorothy',
    'Dottie','Dulce','Dusty','Dyan','Dyanne','Ebony','Edith','Edna','Effie','Eileen',
    'Ela','Elaena','Elaine','Eleanor','Elena','Elektra','Eli','Elina','Elisa','Elisabeth',
    'Eliza','Elizabeth','Ella','Ellen','Ellie','Ellora','Elma','Elmira','Elodie','Eloise',
    'Elsa','Elsie','Elvira','Elyse','Emanuela','Emelia','Emeline','Emerald','Emerson','Emery',
    'Emilie','Emily','Emma','Emmaline','Emmalynn','Emmy','Enid','Erica','Erika','Erin',
    'Esmeralda','Estelle','Esther','Ethel','Eudora','Eugenia','Eulalia','Euna','Eva','Eve',
    'Evelyn','Everly','Evonne','Exie','Eydie','Fabiana','Fallyn','Fannie','Farrah','Fatima',
    'Fawn','Faye','Felicia','Fern','Fernanda','Fiona','Fiorella','Flo','Flora','Florence',
    'Frances','Francesca','Francine','Frankie','Freda','Freida','Gabriella','Gabrielle','Gail','Garnet',
    'Geneva','Georgia','Georgina','Geraldine','Gertrude','Gia','Gianna','Gigi','Gillian','Gina',
    'Ginger','Giselle','Glenda','Glenna','Gloria','Goldie','Grace','Gracie','Gracelyn','Greta',
    'Gwendolyn','Gwen','Gwyneth','Hailey','Haleigh','Haley','Hana','Hannah','Harmony','Harper',
    'Harriet','Hattie','Hayley','Hazel','Heather','Hedwig','Heidi','Helena','Henrietta',
    'Henriette','Hertha','Hilda','Hillary','Holly','Hope','Hortense','Hosanna',
    'Hulda','Hyacinth','Ida','Idalia','Idella','Ila','Ilene','Iliana','Imelda','Imogen',
    'Ingrid','Iola','Iona','Ira','Irene','Iris','Irma','Isa','Isabel','Isabella',
    'Isabelle','Isadora','Isis','Ivanna','Ivory','Ivy','Jackie','Jada','Jade','Jaelyn',
    'Jaime','Jaimie','Jamie','Jan','Jana','Jane','Janelle','Janet','Janice','Janie',
    'Janine','Jannie','Jaqueline','Jasmine','Jay','Jayla','Jayne','Jean','Jeana','Jeanette',
    'Jeanne','Jenna','Jennifer','Jenny','Jerri','Jess','Jessica','Jessie','Jessika','Jill',
    'Jillian','Jo','Joan','Joana','Joanna','Joanne','Jocelyn','Jodi','Jodie','Jody',
    'Johanna','Jolene','Joni','Jordan','Josefina','Josephine','Josie','Journey','Joy','Joyce'
];

const middleNames = [
    'Michael','Rose','David','Jane','William','Ann',
    'Thomas','Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew',
    'Joshua','Kenneth','Kevin','Brian','George','Edward','Ronald','Timothy','Jason','Jeffrey',
    'Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott',
    'Brandon','Benjamin','Samuel','Gregory','Frank','Raymond','Patrick','Jack','Dennis','Jerry',
    'Tyler','Aaron','Jose','Adam','Henry','Nathan','Douglas','Zachary','Peter','Kyle',
    'Walter','Ethan','Jeremy','Harold','Keith','Christian','Roger','Noah','Gerald','Carl',
    'Terence','Austin','Sean','Willie','Billy','Jesse','Roy','Bruce','Joe','Dylan',
    'Jordan','Carlos','Russell','Wayne','Albert','Eugene','Alexander','Marie','James','Grace',
];

const middleExtraPrefixes = ['An','El','Jo','Ma','Ka','Da','La','Sha','Tre','Ke','Ra','Ty','Br','Cr','Dr','Fr','Gr','Kr','Pr','Tr','Ca','Ro','Vi','Lu','Mi','Na','Jo','El','An','Ma','Ka','Da','La','Sha','Tre','Ke','Ra','Ty','Br','Cr','Dr','Fr','Gr','Kr','Pr','Tr'];
const middleExtraMids = ['la','li','lo','lu','a','e','i','o','u','el','il','on','en','in','an','un','ar','er','ir','or','ur','al','ol','em','im','om','um','ay','oy','ey','iy','uy'];
const middleExtraSuffixes = ['a','e','i','o','u','n','s','t','r','l','m','y','d','g','p','b','v','c','k','h','field','brook','stone','wood','hill','dale','vale','ford','port','haven'];

while (middleNames.length < 1000) {
    let added = 0;
    for (const p of middleExtraPrefixes) {
        for (const m of middleExtraMids) {
            for (const s of middleExtraSuffixes) {
                const name = (p + m + s).charAt(0).toUpperCase() + (p + m + s).slice(1).toLowerCase();
                if (!middleNames.includes(name)) {
                    middleNames.push(name);
                    added++;
                    if (middleNames.length >= 1000) break;
                }
            }
            if (middleNames.length >= 1000) break;
        }
        if (middleNames.length >= 1000) break;
    }
    if (added === 0) break;
}

const lastNames = [
  "Threewit", "Chaney", "Abbott", "Abernathy", "Acheson", "Ackerman", "Adair", "Adams", "Adkins",
  "Ainsworth", "Albright", "Aldridge", "Alexander", "Alford", "Allen", "Allgood", "Allison", "Allred", "Ambrose",
  "Ames", "Amos", "Andersen", "Anderson", "Andrade", "Andrews", "Anthony", "Archer", "Archibald", "Armitage",
  "Armstrong", "Arnett", "Arnold", "Arthur", "Ashby", "Ashcroft", "Ashley", "Ashton", "Atkins", "Atkinson",
  "Atwood", "Aubrey", "Austen", "Austin", "Avery", "Ayers",
  
  "Babcock", "Bachman", "Bacon", "Badger", "Bagley", "Bailey", "Bainbridge", "Baird", "Baker", "Baldwin",
  "Ballard", "Bancroft", "Banks", "Bannister", "Barber", "Barclay", "Barker", "Barlow", "Barnard", "Barnes",
  "Barnett", "Barnhart", "Baron", "Barr", "Barrett", "Barrows", "Barry", "Bartlett", "Barton", "Bass",
  "Bassett", "Bateman", "Bates", "Bauer", "Baxter", "Baylor", "Beach", "Beale", "Beall", "Beam",
  "Bean", "Beard", "Beasley", "Beattie", "Beatty", "Beauchamp", "Beaumont", "Beaver", "Beck", "Becker",
  
  "Cable", "Cade", "Cadieux", "Cady", "Cagle", "Cahill", "Cain", "Caine", "Cairns", "Calder",
  "Caldwell", "Calhoun", "Calkins", "Call", "Callahan", "Callaway", "Calloway", "Calvert", "Calvin", "Camacho",
  "Cameron", "Camp", "Campbell", "Canfield", "Cannady", "Cannon", "Canter", "Cantrell", "Cantwell", "Caples",
  "Capp", "Capps", "Capri", "Caraway", "Card", "Carder", "Cardwell", "Carey", "Cargill", "Carhart",
  "Carl", "Carleton", "Carlisle", "Carlson", "Carlton", "Carmichael", "Carnes", "Carney", "Carothers", "Carpenter",
  
  "Dalton", "Daly", "Damon", "Danforth", "Daniel", "Daniels", "Danson", "Darby", "Darcy", "Darden",
  "Darling", "Darnell", "Darrow", "Daugherty", "Davenport", "Davern", "David", "Davidson", "Davies", "Davila",
  "Davis", "Davison", "Dawson", "Day", "Deacon", "Deal", "Dean", "Deane", "Dearborn", "Deaton",
  "Decker", "Deegan", "Deering", "Deeter", "Defelice", "Delaney", "Delgado", "Dell", "Delong", "Dempsey",
  
  "Eades", "Eagan", "Eager", "Eakes", "Eakins", "Earle", "Earley", "Earls", "Early", "Earnest",
  "Earp", "Easley", "Eason", "East", "Easter", "Easterling", "Eastman", "Easton", "Eaton", "Eaves",
  "Ebanks", "Eberhard", "Eberhart", "Eberly", "Ebert", "Eble", "Echevarria", "Echols", "Eck", "Eckard",
  
  "Faber", "Fabian", "Fagan", "Fahy", "Fair", "Fairbanks", "Fairchild", "Fairfax", "Fairley", "Falconer",
  "Falk", "Falkner", "Fallon", "Fanning", "Farley", "Farmer", "Farnsworth", "Farr", "Farrell", "Farrington",
  "Faulkner", "Fawcett", "Feeney", "Feldman", "Fenn", "Fenton", "Ferguson", "Fernandez", "Ferrell", "Ferris",
  
  "Gable", "Gaddis", "Gaffney", "Gage", "Gaines", "Gaither", "Galbraith", "Gale", "Gallagher", "Galloway",
  "Gamble", "Gannon", "Garcia", "Gardiner", "Gardner", "Garfield", "Garland", "Garner", "Garrett", "Garrison",
  "Garth", "Garvey", "Gaskins", "Gass", "Gaston", "Gates", "Gatlin", "Gault", "Gauthier", "Gavin",
  
  "Haag", "Haas", "Hacker", "Hackett", "Hadley", "Hagan", "Hagen", "Hager", "Haggard", "Hahn",
  "Haines", "Hairston", "Hale", "Haley", "Hall", "Hallmark", "Hallowell", "Halsey", "Halstead", "Halverson",
  "Hamill", "Hamilton", "Hamlin", "Hammond", "Hampton", "Hancock", "Hand", "Handley", "Haney", "Hankins",
  
  "Iams", "Ibbetson", "Ibbott", "Ibbotson", "Ibrahim", "Ibsen", "Ice", "Ickes", "Iddings", "Ide",
  "Idell", "Idelson", "Iler", "Iles", "Iliff", "Illingworth", "Ilsley", "Imboden", "Imbriani", "Imes",
  "Hoffman", "Imhoff", "Imlay", "Ince", "Ingalls", "Ingersoll", "Ingham", "Ingle", "Ingraham", "Ingram",
  
  "Jack", "Jackman", "Jackson", "Jacob", "Jacobs", "Jacobson", "Jacoby", "Jacques", "Jaeger", "Jahn",
  "James", "Jameson", "Jamieson", "Jamison", "Janes", "Jankowski", "Jansen", "Janssen", "Jaramillo", "Jarrell",
  "Jarrett", "Jarvis", "Jasper", "Jay", "Jaynes", "Jefferies", "Jeffers", "Jefferson", "Jeffery", "Jeffrey",
  
  "Kahn", "Kaiser", "Kalish", "Kamm", "Kane", "Kanter", "Kaplan", "Karas", "Karg", "Karr",
  "Karsten", "Kasper", "Kastner", "Kates", "Katz", "Kauffman", "Kaufman", "Kaye", "Kean", "Keane",
  "Kearney", "Kearns", "Keating", "Keaton", "Keck", "Keech", "Keefe", "Keefer", "Keegan", "Keel",
  
  "Labatte", "Lacey", "Lachance", "Lachman", "Lackey", "Lacock", "Lacroix", "Lacy", "Ladd", "Lafferty",
  "Laflamme", "Lafleur", "Lafond", "Laframboise", "Lafrance", "Laird", "Lake", "Lally", "Lamar", "Lamarche",
  "Lamb", "Lambert", "Lambright", "Lancaster", "Lance", "Land", "Landers", "Landis", "Landon", "Landry",
  
  "Mabe", "Mabry", "MacArthur", "Macaulay", "MacDonald", "MacFarlane", "MacGregor", "Machado", "Macias", "MacIntosh",
  "MacKay", "MacKenzie", "Mackey", "MacLeod", "MacMillan", "MacNamara", "MacPherson", "Madden", "Maddox", "Madsen",
  "Magee", "Magill", "Magnuson", "Maguire", "Mahon", "Mahoney", "Maier", "Main", "Major", "Makinen",
  
  "Nabb", "Nace", "Nachtigal", "Nack", "Nadeau", "Nader", "Naftzger", "Nagel", "Nagle", "Nagy",
  "Nail", "Nailor", "Nair", "Nairn", "Nall", "Nance", "Napier", "Nash", "Nason", "Nasser",
  "Nathan", "Nation", "Naughten", "Naughton", "Nault", "Naumann", "Navarre", "Navarro", "Naylor", "Neal",
  
  "Oakes", "Oakley", "Oates", "Ober", "Oberg", "Oberle", "Oberlin", "O'Brien", "O'Bryan", "O'Connell",
  "O'Connor", "O'Dell", "Odom", "O'Donnell", "Oelkers", "Oettinger", "Offutt", "Ogden", "Ogilvie", "Ogle",
  "Oglesby", "O'Grady", "O'Hagan", "O'Hair", "O'Halloran", "O'Hanlon", "O'Hara", "O'Hare", "O'Hearn", "O'Keefe",
  
  "Pace", "Pacheco", "Pack", "Packard", "Packer", "Paddack", "Paddock", "Padgett", "Padilla", "Pagan",
  "Page", "Pagel", "Paget", "Pahl", "Paige", "Paine", "Painter", "Paisley", "Palermo", "Paley",
  "Palma", "Palmer", "Palmiter", "Palumbo", "Pancake", "Panek", "Pannell", "Pape", "Pappas", "Paradis",
  
  "Quackenbush", "Quain", "Quale", "Qualey", "Qualls", "Quarles", "Quarton", "Quast", "Quattlebaum", "Quay",
  "Quayle", "Queen", "Queener", "Quelch", "Querry", "Quessenberry", "Quick", "Quiggle", "Quigley", "Quill",
  "Quillen", "Quillin", "Quimby", "Quinby", "Quinlan", "Quinn", "Quintana", "Quintero", "Quinton", "Quirk",
  
  "Raab", "Rabe", "Rabideau", "Rabin", "Rabinowitz", "Race", "Racer", "Radcliff", "Radcliffe", "Rader",
  "Radke", "Radley", "Radford", "Rae", "Rafferty", "Ragan", "Ragsdale", "Rahn", "Raikes",
  "Raines", "Rainey", "Rains", "Raisor", "Rake", "Rakes", "Rakestraw", "Raleigh", "Raley", "Ralph",
  
  "Sabin", "Sabine", "Sackett", "Saddler", "Sadler", "Safford", "Sagan", "Sage", "Sager", "Sailor",
  "Sain", "Saines", "Salas", "Salazar", "Sales", "Salisbury", "Salley", "Sallows", "Salmon", "Salmons",
  "Salter", "Saltzman", "Salveson", "Sammons", "Sample", "Samples", "Sampson", "Samson", "Samuel", "Samuels",
  
  "Tabb", "Tabor", "Tackett", "Taft", "Taggart", "Tague", "Tait", "Talbert", "Talbot", "Talbott",
  "Talcott", "Taliaferro", "Tallant", "Tallent", "Talley", "Tallis", "Tallman", "Tally", "Tatum",
  "Taulbee", "Tavarez", "Tavernier", "Taylor", "Teague", "Teal", "Teasley", "Tebbetts", "Tedder", "Teel",
  
  "Uhl", "Uhlenbrock", "Uhler", "Uhlman", "Uhrig", "Uihlein", "Ulbricht", "Ulery", "Ulmer", "Ulrich",
  "Umberger", "Umlauf", "Underwood", "Unger", "Ungaro", "Unruh", "Unsworth", "Upchurch", "Updike",
  "Upham", "Uphoff", "Upshaw", "Upton", "Urban", "Urbina", "Uren", "Uribe", "Urquhart", "Usher",
  
  "Vail", "Vaillancourt", "Valdes", "Valdez", "Vale", "Valencia", "Valentine", "Valenzuela", "Valera", "Valerio",
  "Valli", "Vallone", "VanBuskirk", "Vance", "Vancleave", "VanCuren", "Vancil", "VanDeusen", "Vandervort", "Vanderbilt",
  "Vandeventer", "VanDoren", "VanDyke", "VanEpps", "VanGilder", "VanHorn", "VanMeter", "Vann", "Vanner", "Vannoy",
  
  "Waddell", "Waddy", "Wade", "Wadhams", "Wadington", "Wadley", "Wadsworth", "Waer", "Wagar", "Wageman",
  "Waggener", "Waggoner", "Wagner", "Wagoner", "Wagschal", "Wagstaff", "Wahl", "Wahlen", "Wahler", "Waid",
  "Wainwright", "Wait", "Waite", "Waites", "Waits", "Wakefield", "Wakeman", "Walbridge", "Walburn", "Walcott",
  
  "Xander", "Xanthos", "Xavier", "Xenakis", "Xiang", "Ximenez", "Xiong", "Xu", "Xue", "Xanthopoulos",
  
  "Yager", "Yager", "Yahn", "Yake", "Yancey", "Yancy", "Yandell", "Yanes", "Yankey", "Yantis", "Yarborough",
  "Yarbrough", "Yard", "Yardley", "Yarnall", "Yarnell", "Yarrington", "Yates", "Yeager", "Yeagley", "Yeaman",
  
  "Zabel", "Zachary", "Zack", "Zager", "Zahn", "Zahner", "Zaiser", "Zito", "Zander", "Zandt",
  "Zane", "Zang", "Zank", "Zeno", "Zapata", "Zapp", "Zappa", "Zebrowski", "Zehner", "Zeigler",


  "Focker", "Skywalker", "Vader", "Baggins", "Stark", "Lannister", "Wayne", "Kent", "Parker", "Banner",
  "Potter", "Weasley", "Granger", "Spengler", "Venkman", "Zeddemore", "Stantz", "Simpson", "Flanders", "Wiggum",
  "Gump", "McFly", "Tannen", "Biff", "Solo", "Calrissian", "Boba", "Kenobi", "Palpatine", "Organa",
  "Corleone", "Soprano", "Bluth", "Costanza", "Kramer", "Seinfeld", "Benes", "Moe", "Barone",
  "Scranton", "Malone", "Burgundy", "Baxter", "Meow", "Kensington", "Danger", "Dangerfield", "Powers", "Evil",
  "Swinger", "Fembot", "Numbertwo", "Mustache", "Baggage", "Bagel", "Baking", "Baloney", "Banana", "Bandit",
  "Bang", "Banger", "Bankrupt", "Banshee", "Barbaric", "Barbecue", "Bare", "Barking", "Barley", "Baron",
  "Barrel", "Bartholomew", "Bash", "Basher", "Basement", "Basilisk", "Basket", "Baster", "Bat", "Batcave",
  "Batty", "Bauble", "Bawl", "Bazooka", "Beachy", "Beaker", "Beamish", "Beans", "Bear", "Beast",
  "Beaten", "Bedlam", "Bedpan", "Beehive", "Beelzebub", "Beer", "Beetle", "Beggars", "Behavior", "Belch",
  "Bellow", "Bellyache", "Belt", "Bemused", "Bender", "Benedict", "Berserk", "Bestest", "Beverage", "Beverly",
  "Bewitched", "Bibble", "Biceps", "Bicker", "Bicycle", "Biff", "Bigfoot", "Biggins", "Biggot", "Biggs",
  "Bigmouth", "Bikini", "Bile", "Billboard", "Billiard", "Billion", "Billy", "Bimbo", "Binary",
  "Bingo", "Binkie", "Binocular", "Bionic", "Birch", "Birdbrain", "Birdseed", "Biscuit", "Bish", "Bite",
  "Biter", "Bittersweet", "Bizzaro", "Blabber", "Blackout", "Blah", "Blam", "Blank", "Blanket", "Blaster",
  "Blaze", "Bleach", "Bleed", "Blemish", "Blender", "Blesst", "Blick", "Blink", "Blissful", "Blob",
  "Blockhead", "Blonde", "Blood", "Blossom", "Blot", "Blouse", "Blowfish", "Blubber", "Blueberry", "Bluff",
  "Blunder", "Blunt", "Blur", "Blurt", "Boar", "Boaster", "Boastful", "Bobble", "Bobsled", "Bodacious",
  "Bodyguard", "Bogey", "Bogus", "Boiler", "Boing", "Boisterous", "Bold", "Bologna", "Bolster", "Bolt",
  "Bombastic", "Bombshell", "Bonanza", "Bonaventure", "Bondage", "Bones", "Bong", "Bonkers", "Bonnet", "Booby",
  "Boogie", "Bookworm", "Boom", "Boomerang", "Boondocks", "Boost", "Boot", "Booth", "Bootlick", "Booty",
  "Booze", "Bozo", "Bramble", "Branch", "Brandy", "Brash", "Brass", "Brat", "Bravado", "Brave",


  "Xylos", "Vexlor", "Zandor", "Kaelen", "Thorne", "Vandread", "Nexis", "Zephyr", "Aethel", "Cyborg",
  "Drakon", "Exar", "Faelar", "Gryphon", "Helios", "Icarus", "Jaxon", "Krytos", "Lysander", "Myrix",
  "Nox", "Orion", "Phryx", "Quillon", "Ragnar", "Sylth", "Tarix", "Ulvric", "Vesper", "Wren",
  "Xylar", "Yvaine", "Zarek", "Astra", "Balthor", "Calix", "Dax", "Elora", "Fenn", "Gideon",
  "Haxor", "Ignis", "Jarek", "Kael", "Lunaris", "Malakor", "Nyx", "Onyx", "Phaeton", "Quasar",
  "Roxis", "Stellan", "Tarkin", "Ulix", "Vandemar", "Wix", "Xenon", "Yarrick", "Zoltar", "Azar",
  "Brix", "Cora", "Drakul", "Ember", "Frost", "Glimmer", "Hex", "Inix", "Jinx", "Klaatu",
  "Lorn", "Maelstrom", "Nadir", "Orbit", "Pryce", "Qorbin", "Riktor", "Sable", "Talon", "Umbra",
  "Vex", "Wyrd", "Xara", "Yule", "Zula", "Alaris", "Barix", "Crixus", "Davor", "Eldritch",
  "Faris", "Galt", "Harkon", "Iridian", "Jorvik", "Kerrigan", "Lore", "Morvath", "Noxis", "Orvyn",
  "Pyre", "Quill", "Rix", "Sarn", "Taggart", "Uther", "Vane", "Wulf", "Xyloto", "Yandell",
  "Zant", "Aethelgard", "Bramwell", "Calthorpe", "Davenport", "Evelith", "Falken", "Garrick", "Hallowell", "Isolde",
  "Jorah", "Kincaid", "Larks", "Morgath", "Norvell", "Oakhaven", "Pendraki", "Quenby", "Radcliff", "Sinclair",
  "Tregarth", "Ulyth", "Valerius", "Wynd", "Xanth", "Yvone", "Zandrak", "Aethelred", "Bracken", "Caspian",
  "Drusilla", "Emeric", "Fane", "Gareth", "Hadrian", "Isambard", "Jovian", "Kestrel", "Leander", "Morwenna",
  "Nesta", "Oberon", "Perseus", "Quintin", "Roderick", "Severin", "Titus", "Urien", "Valerian", "Wymond",
  "Xanthe", "Yseult", "Zephyrin", "Aralen", "Balthazar", "Cassian", "Demetrius", "Evander", "Fenwick", "Gideon",
  "Hester", "Ignatius", "Jocelyn", "Kian", "Lysander", "Melior", "Nicodemus", "Orson", "Percival", "Quigley",
  "Remus", "Sylvan", "Tristan", "Urban", "Valeriana", "Waldo", "Xena", "Yvaine", "Zeno", "Alastair",
  "Barnaby", "Clement", "Dara", "Emera", "Flint", "Gulliver", "Hawthorne", "Iona", "Jemima", "Kitt",
  "Lachlan", "Mallow", "Nightingale", "Oona", "Peregrine", "Quiller", "Rowan", "Saffron", "Thistle", "Una",
  "Vespera", "Winter", "Xalvador", "Yarrow", "Zinnia", "Amon", "Bane", "Crix", "Daxor", "Eon"
];

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const firstLists = { male: maleFirstNames, female: femaleFirstNames };
    const first = pickRandom(firstLists[gender]);
    const middle = Math.random() < 0.3 ? pickRandom(middleNames) + ' ' : '';
    const last = pickRandom(lastNames);
    return `${first} ${middle}${last}`.trim();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        maleFirstNames,
        femaleFirstNames,
        middleNames,
        lastNames,
        pickRandom,
        generateName,
    };
}

if (typeof window !== 'undefined') {
    window.SportsNames = {
        maleFirstNames,
        femaleFirstNames,
        middleNames,
        lastNames,
        pickRandom,
        generateName,
    };
}
